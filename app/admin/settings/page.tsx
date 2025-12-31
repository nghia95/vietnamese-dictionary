'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AdminSettingsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [welcomeText, setWelcomeText] = useState('');
    const [welcomeImage, setWelcomeImage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }
        if (session && session.user?.role !== 'admin') {
            router.push('/');
            return;
        }

        fetchSettings();
    }, [session, status, router]);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings');
            const data = await res.json();
            if (data.settings) {
                setWelcomeText(data.settings.home_welcome_text || 'Chào mừng đến với Từ Điển Việt');
                setWelcomeImage(data.settings.home_welcome_image || '📖');
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            setMessage({ type: 'error', text: 'Không thể tải cài đặt' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);

        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    settings: {
                        home_welcome_text: welcomeText,
                        home_welcome_image: welcomeImage
                    }
                })
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Đã lưu cài đặt thành công!' });
            } else {
                setMessage({ type: 'error', text: 'Có lỗi xảy ra khi lưu' });
            }
        } catch (error) {
            console.error('Save error:', error);
            setMessage({ type: 'error', text: 'Lỗi kết nối' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="container p-8 text-center">Đang tải...</div>;
    if (!session || session.user?.role !== 'admin') return null;

    return (
        <div className="container max-w-2xl mx-auto py-8">
            <h1 className="text-2xl font-bold mb-6">⚙️ Cài đặt Trang chủ</h1>

            <form onSubmit={handleSave} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border">
                {message && (
                    <div className={`p-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Text Chào mừng
                    </label>
                    <input
                        type="text"
                        value={welcomeText}
                        onChange={(e) => setWelcomeText(e.target.value)}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="VD: Chào mừng đến với Từ Điển Việt"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Icon/Hình ảnh (Emoji, URL hoặc tải ảnh lên)
                    </label>
                    <div className="space-y-3">
                        <input
                            type="text"
                            value={welcomeImage}
                            onChange={(e) => setWelcomeImage(e.target.value)}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="VD: 📖 hoặc https://example.com/image.png"
                        />

                        {(welcomeImage.startsWith('http') || welcomeImage.startsWith('data:image')) && (
                            <div className="mt-2 text-center border p-2 rounded bg-gray-50">
                                <p className="text-xs text-gray-500 mb-1">Xem trước:</p>
                                <img
                                    src={welcomeImage}
                                    alt="Preview"
                                    className="mx-auto h-24 w-auto object-contain"
                                />
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Hoặc tải ảnh lên:</span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;

                                    if (file.size > 500 * 1024) {
                                        setMessage({ type: 'error', text: 'Ảnh phải nhỏ hơn 500KB' });
                                        e.target.value = ''; // Reset input
                                        return;
                                    }

                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                        const base64 = event.target?.result as string;
                                        setWelcomeImage(base64);
                                    };
                                    reader.readAsDataURL(file);
                                }}
                                className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                            />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Nhập emoji, đường dẫn ảnh, hoặc tải ảnh từ máy (tối đa 500KB).
                    </p>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                        {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                </div>
            </form>
        </div>
    );
}
