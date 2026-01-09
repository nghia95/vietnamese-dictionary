
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import styles from './page.module.css'; // You'll likely need to create this CSS file or reuse an existing one

export default function WordTypesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [types, setTypes] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingType, setEditingType] = useState<string | null>(null);
    const [newTypeName, setNewTypeName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            const role = session?.user?.role;
            if (role !== 'admin' && role !== 'moderator') {
                router.push('/');
            } else {
                fetchTypes();
            }
        }
    }, [status, session, router]);

    const fetchTypes = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/types');
            const data = await res.json();
            if (data.types) {
                setTypes(data.types);
            }
        } catch (error) {
            console.error('Failed to fetch types:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditClick = (type: string) => {
        setEditingType(type);
        setNewTypeName(type);
    };

    const handleCancelEdit = () => {
        setEditingType(null);
        setNewTypeName('');
    };

    const handleSaveEdit = async () => {
        if (!editingType || !newTypeName.trim() || editingType === newTypeName) {
            handleCancelEdit();
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/types', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ oldName: editingType, newName: newTypeName.trim() })
            });

            const data = await res.json();

            if (res.ok) {
                alert(`Đã cập nhật thành công ${data.updatedCount} mục từ '${editingType}' thành '${newTypeName}'`);
                fetchTypes(); // Refresh list
                handleCancelEdit();
            } else {
                alert(data.error || 'Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('Update error:', error);
            alert('Có lỗi xảy ra khi cập nhật');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateType = async (e: React.FormEvent) => {
        e.preventDefault();
        const input = (document.getElementById('newTypeInput') as HTMLInputElement);
        const name = input.value.trim();

        if (!name) return;

        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/types', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });

            if (res.ok) {
                input.value = '';
                fetchTypes();
            } else {
                const data = await res.json();
                alert(data.error || 'Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('Create error:', error);
            alert('Có lỗi xảy ra khi tạo mới');
        } finally {
            setIsSaving(false);
        }
    };

    if (status === 'loading' || isLoading) {
        return (
            <div className="container loading-container">
                <div className="loading"></div>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '2rem 0' }}>
            <h1 className="page-title">Quản lý Loại từ (Word Types)</h1>
            <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
                Danh sách các loại từ chuẩn hóa. Thay đổi ở đây sẽ cập nhật toàn bộ từ điển.
            </p>

            <form onSubmit={handleCreateType} style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
                <input
                    id="newTypeInput"
                    type="text"
                    placeholder="Thêm loại từ mới..."
                    className="input-field"
                    style={{ flex: 1, maxWidth: '400px' }}
                    disabled={isSaving}
                />
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSaving}
                >
                    {isSaving ? 'Đang xử lý...' : '➕ Thêm'}
                </button>
            </form>

            <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Loại từ (Type)</th>
                            <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#374151' }}>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {types.length === 0 ? (
                            <tr>
                                <td colSpan={2} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                                    Chưa có dữ liệu loại từ.
                                </td>
                            </tr>
                        ) : (
                            types.map((type, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '1rem' }}>
                                        {editingType === type ? (
                                            <input
                                                type="text"
                                                value={newTypeName}
                                                onChange={(e) => setNewTypeName(e.target.value)}
                                                className="input-field"
                                                autoFocus
                                                style={{ width: '100%', maxWidth: '300px' }}
                                            />
                                        ) : (
                                            <span style={{ fontWeight: '500', color: 'var(--accent-blue)' }}>{type}</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        {editingType === type ? (
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={handleSaveEdit}
                                                    disabled={isSaving}
                                                    style={{ fontSize: '0.875rem', padding: '0.4rem 0.8rem' }}
                                                >
                                                    {isSaving ? 'Đang lưu...' : 'Lưu'}
                                                </button>
                                                <button
                                                    className="btn"
                                                    onClick={handleCancelEdit}
                                                    disabled={isSaving}
                                                    style={{ fontSize: '0.875rem', padding: '0.4rem 0.8rem', background: '#e5e7eb', color: '#374151' }}
                                                >
                                                    Hủy
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                className="btn"
                                                onClick={() => handleEditClick(type)}
                                                style={{ fontSize: '0.875rem', padding: '0.4rem 0.8rem' }}
                                            >
                                                ✏️ Chỉnh sửa
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
