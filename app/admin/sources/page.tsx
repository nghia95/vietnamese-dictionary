'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SourcesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [sources, setSources] = useState<string[]>([]);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editValue, setEditValue] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    useEffect(() => {
        fetchSources();
    }, []);

    const fetchSources = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/sources');
            if (res.ok) {
                const data = await res.json();
                setSources(data.sources || []);
            }
        } catch (error) {
            console.error('Error fetching sources:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (index: number) => {
        setEditingIndex(index);
        setEditValue(sources[index]);
    };

    const handleCancel = () => {
        setEditingIndex(null);
        setEditValue('');
    };

    const handleSave = async (oldName: string) => {
        if (!editValue.trim()) {
            alert('Tên nguồn không được để trống');
            return;
        }

        if (editValue.trim() === oldName) {
            handleCancel();
            return;
        }

        if (!confirm(`Bạn có chắc chắn muốn đổi tên nguồn "${oldName}" thành "${editValue}"?\n\nThao tác này sẽ cập nhật tất cả các định nghĩa sử dụng nguồn này.`)) {
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/sources', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ oldName, newName: editValue.trim() })
            });

            const data = await res.json();

            if (res.ok) {
                alert(data.message || 'Cập nhật thành công!');
                setEditingIndex(null);
                setEditValue('');
                fetchSources(); // Refresh the list
            } else {
                alert(data.error || 'Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('Error updating source:', error);
            alert('Có lỗi xảy ra khi cập nhật');
        } finally {
            setIsSaving(false);
        }
    };

    if (status === 'loading' || isLoading) {
        return (
            <div className="container mx-auto p-6">
                <div className="loading"></div>
                <p>Đang tải...</p>
            </div>
        );
    }

    if (session?.user?.role !== 'admin' && session?.user?.role !== 'moderator') {
        return (
            <div className="container mx-auto p-6">
                <h1 className="text-2xl font-bold mb-4">Không có quyền truy cập</h1>
                <p>Chỉ admin và moderator mới có thể truy cập trang này.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Tài liệu tham khảo</h1>
            <p className="text-gray-600 mb-4">
                Quản lý các nguồn tham khảo được sử dụng trong từ điển.
                Khi đổi tên nguồn, tất cả các định nghĩa sử dụng nguồn đó sẽ được cập nhật.
            </p>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="table w-full">
                    <thead>
                        <tr>
                            <th className="text-left">STT</th>
                            <th className="text-left">Tên nguồn</th>
                            <th className="text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sources.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="text-center py-8 text-gray-500">
                                    Chưa có nguồn nào
                                </td>
                            </tr>
                        ) : (
                            sources.map((source, index) => (
                                <tr key={index} className="hover">
                                    <td>{index + 1}</td>
                                    <td>
                                        {editingIndex === index ? (
                                            <input
                                                type="text"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                className="input input-bordered input-sm w-full max-w-md"
                                                disabled={isSaving}
                                                autoFocus
                                            />
                                        ) : (
                                            <span className="font-medium">{source}</span>
                                        )}
                                    </td>
                                    <td className="text-right">
                                        {editingIndex === index ? (
                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    onClick={() => handleSave(source)}
                                                    disabled={isSaving}
                                                    className="btn btn-sm btn-success text-white"
                                                >
                                                    {isSaving ? 'Đang lưu...' : 'Lưu'}
                                                </button>
                                                <button
                                                    onClick={handleCancel}
                                                    disabled={isSaving}
                                                    className="btn btn-sm"
                                                >
                                                    Hủy
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleEdit(index)}
                                                className="btn btn-sm btn-primary"
                                            >
                                                ✏️ Sửa
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
