'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface User {
    id: number;
    email: string;
    name: string;
    role: string;
    banned_until: string | null;
    created_at: string;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const { data: session, status } = useSession();
    const router = useRouter();

    const [banDuration, setBanDuration] = useState<string>('1'); // days
    const [selectedUserForBan, setSelectedUserForBan] = useState<User | null>(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }

        if (status === 'authenticated' && session?.user?.role !== 'admin') {
            router.push('/');
            return;
        }

        if (status === 'authenticated' && session?.user?.role === 'admin') {
            fetchUsers();
        }
    }, [status, session, router]);

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/admin/users');
            const data = await response.json();
            if (response.ok) {
                setUsers(data.users);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to fetch users');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRoleUpdate = async (userId: number, currentRole: string) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        if (!confirm(`Are you sure you want to change role to ${newRole}?`)) return;

        try {
            const response = await fetch(`/api/admin/users/${userId}/role`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole }),
            });

            if (response.ok) {
                fetchUsers();
            } else {
                alert('Failed to update role');
            }
        } catch (err) {
            alert('Error updating role');
        }
    };

    const handleBanUser = async () => {
        if (!selectedUserForBan) return;

        let bannedUntil = null;
        if (banDuration !== 'unban') {
            const date = new Date();
            if (banDuration === 'forever') {
                date.setFullYear(date.getFullYear() + 100);
            } else {
                date.setDate(date.getDate() + parseInt(banDuration));
            }
            bannedUntil = date.toISOString();
        }

        try {
            const response = await fetch(`/api/admin/users/${selectedUserForBan.id}/ban`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bannedUntil }),
            });

            if (response.ok) {
                fetchUsers();
                setSelectedUserForBan(null);
            } else {
                alert('Failed to update ban status');
            }
        } catch (err) {
            alert('Error updating ban status');
        }
    };

    const handleDeleteUser = async (userId: number) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                fetchUsers();
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to delete user');
            }
        } catch (err) {
            alert('Error deleting user');
        }
    };

    if (isLoading) return <div className="container loading"></div>;

    return (
        <div style={{ padding: '2rem 0', minHeight: '80vh', backgroundColor: '#f9fafb' }}>
            <div className="container">
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem', color: '#1f2937' }}>Quản lý người dùng</h1>

                {error && <div className="alert alert-error">{error}</div>}

                <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ backgroundColor: '#f3f4f6' }}>
                            <tr>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'black' }}>Tên</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'black' }}>Email</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#4b5563' }}>Vai trò</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#4b5563' }}>Trạng thái</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#4b5563' }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '1rem', color: 'black' }}>{user.name}</td>
                                    <td style={{ padding: '1rem', color: 'black' }}>{user.email}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '9999px',
                                            fontSize: '0.875rem',
                                            backgroundColor: user.role === 'admin' ? '#dbeafe' : '#e5e7eb',
                                            color: user.role === 'admin' ? '#1e40af' : '#374151'
                                        }}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {user.banned_until && new Date(user.banned_until) > new Date() ? (
                                            <span style={{ color: '#dc2626', fontWeight: '500' }}>
                                                Bị cấm đến {new Date(user.banned_until).toLocaleDateString('vi-VN')}
                                            </span>
                                        ) : (
                                            <span style={{ color: '#059669' }}>Hoạt động</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => handleRoleUpdate(user.id, user.role)}
                                                style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', borderRadius: '0.25rem', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer' }}
                                                disabled={user.email === 'nghiahcmut95@gmail.com'}
                                            >
                                                {user.role === 'admin' ? 'Gỡ Admin' : 'Thêm Admin'}
                                            </button>

                                            <button
                                                onClick={() => setSelectedUserForBan(user)}
                                                style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', borderRadius: '0.25rem', border: '1px solid #fca5a5', background: '#fef2f2', color: '#991b1b', cursor: 'pointer' }}
                                                disabled={user.role === 'admin'}
                                            >
                                                {user.banned_until && new Date(user.banned_until) > new Date() ? 'Quản lý cấm' : 'Cấm'}
                                            </button>

                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', borderRadius: '0.25rem', border: '1px solid #fca5a5', background: '#dc2626', color: 'white', cursor: 'pointer' }}
                                                disabled={user.role === 'admin'}
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {selectedUserForBan && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', width: '100%', maxWidth: '400px' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Quản lý lệnh cấm: {selectedUserForBan.name}</h3>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Thời hạn:</label>
                                <select
                                    value={banDuration}
                                    onChange={(e) => setBanDuration(e.target.value)}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #d1d5db' }}
                                >
                                    <option value="1">1 Ngày</option>
                                    <option value="7">1 Tuần</option>
                                    <option value="30">1 Tháng</option>
                                    <option value="forever">Vĩnh viễn</option>
                                    <option value="unban">Gỡ lệnh cấm</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                <button
                                    onClick={() => setSelectedUserForBan(null)}
                                    style={{ padding: '0.5rem 1rem', borderRadius: '0.25rem', background: '#e5e7eb', border: 'none', cursor: 'pointer' }}
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleBanUser}
                                    style={{ padding: '0.5rem 1rem', borderRadius: '0.25rem', background: '#2563eb', color: 'white', border: 'none', cursor: 'pointer' }}
                                >
                                    Lưu
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
