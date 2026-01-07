'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface Settings {
    logo_text: string;
    logo_image: string;
    logo_type: 'text' | 'image';
    logo_size: string; // Stored as string in DB, but treated as number
    hero_title: string;
    hero_subtitle: string;
    search_placeholder: string;
    contact_email: string;
    contact_phone: string;
    contact_address: string;
    contact_facebook: string;
    contact_youtube: string;
    contact_email_icon: string;
    contact_phone_icon: string;
    contact_address_icon: string;
    contact_facebook_icon: string;
    contact_youtube_icon: string;
    contact_list: string; // JSON string of ContactItem[]
}

export default function AdminSettingsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [settings, setSettings] = useState<Settings>({
        logo_text: '',
        logo_image: '',
        logo_type: 'text',
        logo_size: '40',
        hero_title: '',
        hero_subtitle: '',
        search_placeholder: '',
        contact_email: '',
        contact_phone: '',
        contact_address: '',
        contact_facebook: '',
        contact_youtube: '',
        contact_email_icon: '',
        contact_phone_icon: '',
        contact_address_icon: '',
        contact_facebook_icon: '',
        contact_youtube_icon: '',
        contact_list: '[]',
    });

    // Local state for contact list editing
    interface ContactItem {
        id: string;
        text: string;
        link: string;
        icon: string; // URL or Base64
    }
    const [contacts, setContacts] = useState<ContactItem[]>([]);

    useEffect(() => {
        try {
            const parsed = JSON.parse(settings.contact_list || '[]');
            setContacts(Array.isArray(parsed) ? parsed : []);
        } catch {
            setContacts([]);
        }
    }, [settings.contact_list]); // Sync only on initial load or if backend updates it significantly

    useEffect(() => {
        if (status === 'unauthenticated' || (session && session.user?.role !== 'admin' && session.user?.role !== 'moderator')) {
            router.push('/');
            return;
        }

        if (session) {
            fetchSettings();
        }
    }, [session, status, router]);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings');
            const data = await res.json();
            if (data.settings) {
                setSettings(prev => ({
                    ...prev,
                    ...data.settings
                }));
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            setMessage({ type: 'error', text: 'Không thể tải cài đặt' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: keyof Settings) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 500 * 1024) {
            setMessage({ type: 'error', text: 'Ảnh phải nhỏ hơn 500KB' });
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            setSettings(prev => ({ ...prev, [field]: base64 }));
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);

        try {
            // Update contact_list in settings before saving
            const updatedSettings = {
                ...settings,
                contact_list: JSON.stringify(contacts)
            };

            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings: updatedSettings }),
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Đã lưu cài đặt thành công!' });
            } else {
                setMessage({ type: 'error', text: 'Có lỗi xảy ra khi lưu' });
            }
        } catch (error) {
            console.error('Save settings error:', error);
            setMessage({ type: 'error', text: 'Có lỗi xảy ra khi lưu' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;

    return (
        <div className="container" style={{ padding: '2rem 1rem', maxWidth: '800px' }}>
            <h1 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 'bold' }}>🔧 Cài đặt Trang chủ</h1>

            {message && (
                <div style={{
                    padding: '1rem',
                    marginBottom: '1.5rem',
                    borderRadius: '8px',
                    backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2',
                    color: message.type === 'success' ? '#166534' : '#991b1b',
                    border: message.type === 'success' ? '1px solid #bbf7d0' : '1px solid #fecaca'
                }}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {/* General Section */}
                <section style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', fontWeight: 'semibold', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                        🌐 Chung
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Loại Logo</label>
                            <select
                                name="logo_type"
                                value={settings.logo_type || 'text'}
                                onChange={handleChange}
                                className="form-input"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                            >
                                <option value="text">Chữ (Text)</option>
                                <option value="image">Hình ảnh (Image)</option>
                            </select>
                        </div>
                        {settings.logo_type === 'image' ? (
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Hình ảnh Logo</label>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1 }}>
                                        <input
                                            type="text"
                                            name="logo_image"
                                            value={settings.logo_image}
                                            onChange={handleChange}
                                            placeholder="URL hình ảnh logo"
                                            className="form-input"
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                                        />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e, 'logo_image')}
                                            style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}
                                        />
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Khuyến nghị: Ảnh có nền trong suốt (PNG/WebP), chiều cao khoảng 40px.</p>
                                    </div>
                                    {(settings.logo_image?.startsWith('http') || settings.logo_image?.startsWith('data:image')) && (
                                        <div style={{ padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-primary)' }}>
                                            <img src={settings.logo_image} alt="Logo Preview" style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Tên Logo (Top Left)</label>
                                <input
                                    type="text"
                                    name="logo_text"
                                    value={settings.logo_text}
                                    onChange={handleChange}
                                    placeholder="Từ điển tiếng Việt"
                                    className="form-input"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                                />
                            </div>
                        )}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                Kích thước Logo (px) - {settings.logo_size}px
                            </label>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <input
                                    type="range"
                                    name="logo_size"
                                    min="20"
                                    max="500"
                                    value={settings.logo_size || '40'}
                                    onChange={handleChange}
                                    style={{ flex: 1 }}
                                />
                                <input
                                    type="number"
                                    name="logo_size"
                                    min="20"
                                    max="500"
                                    value={settings.logo_size || '40'}
                                    onChange={handleChange}
                                    className="form-input"
                                    style={{ width: '80px', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Home Hero Section */}
                <section style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', fontWeight: 'semibold', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                        🏠 Trang chủ (Phần tìm kiếm)
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Tiêu đề lớn</label>
                            <input
                                type="text"
                                name="hero_title"
                                value={settings.hero_title}
                                onChange={handleChange}
                                placeholder="Từ điển tiếng Việt"
                                className="form-input"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Phụ đề (Trên thanh tìm kiếm)</label>
                            <input
                                type="text"
                                name="hero_subtitle"
                                value={settings.hero_subtitle}
                                onChange={handleChange}
                                placeholder="Khám phá và học tiếng Việt một cách hiện đại"
                                className="form-input"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Placeholder tìm kiếm</label>
                            <input
                                type="text"
                                name="search_placeholder"
                                value={settings.search_placeholder}
                                onChange={handleChange}
                                placeholder="Tìm kiếm từ vựng tiếng Việt..."
                                className="form-input"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                            />
                        </div>
                    </div>
                </section>



                {/* Standard Contact Section */}
                <section style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', fontWeight: 'semibold', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                        📞 Liên hệ Mặc định (Footer)
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
                        {/* Email */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <label style={{ fontWeight: '500' }}>Email</label>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Mặc định: 📧</span>
                            </div>
                            <input
                                type="email"
                                name="contact_email"
                                value={settings.contact_email}
                                onChange={handleChange}
                                placeholder="email@example.com"
                                className="form-input"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', marginBottom: '0.5rem' }}
                            />
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    name="contact_email_icon"
                                    value={settings.contact_email_icon}
                                    onChange={handleChange}
                                    placeholder="URL icon tùy chỉnh..."
                                    style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
                                />
                                <div style={{ position: 'relative', overflow: 'hidden', display: 'inline-block' }}>
                                    <button type="button" className="btn" style={{ fontSize: '0.8rem', padding: '0.5rem' }}>Upload</button>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, 'contact_email_icon')}
                                        style={{ position: 'absolute', left: 0, top: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Phone */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <label style={{ fontWeight: '500' }}>Số điện thoại</label>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Mặc định: 📞</span>
                            </div>
                            <input
                                type="text"
                                name="contact_phone"
                                value={settings.contact_phone}
                                onChange={handleChange}
                                placeholder="0123 456 789"
                                className="form-input"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', marginBottom: '0.5rem' }}
                            />
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    name="contact_phone_icon"
                                    value={settings.contact_phone_icon}
                                    onChange={handleChange}
                                    placeholder="URL icon tùy chỉnh..."
                                    style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
                                />
                                <div style={{ position: 'relative', overflow: 'hidden', display: 'inline-block' }}>
                                    <button type="button" className="btn" style={{ fontSize: '0.8rem', padding: '0.5rem' }}>Upload</button>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, 'contact_phone_icon')}
                                        style={{ position: 'absolute', left: 0, top: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Address */}
                        <div style={{ gridColumn: 'span 1' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <label style={{ fontWeight: '500' }}>Địa chỉ</label>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Mặc định: 📍</span>
                            </div>
                            <input
                                type="text"
                                name="contact_address"
                                value={settings.contact_address}
                                onChange={handleChange}
                                placeholder="Hồ Chí Minh, Việt Nam"
                                className="form-input"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', marginBottom: '0.5rem' }}
                            />
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    name="contact_address_icon"
                                    value={settings.contact_address_icon}
                                    onChange={handleChange}
                                    placeholder="URL icon tùy chỉnh..."
                                    style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
                                />
                                <div style={{ position: 'relative', overflow: 'hidden', display: 'inline-block' }}>
                                    <button type="button" className="btn" style={{ fontSize: '0.8rem', padding: '0.5rem' }}>Upload</button>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, 'contact_address_icon')}
                                        style={{ position: 'absolute', left: 0, top: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Facebook */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <label style={{ fontWeight: '500' }}>Facebook URL</label>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Mặc định: Facebook</span>
                            </div>
                            <input
                                type="url"
                                name="contact_facebook"
                                value={settings.contact_facebook}
                                onChange={handleChange}
                                placeholder="https://facebook.com/..."
                                className="form-input"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', marginBottom: '0.5rem' }}
                            />
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    name="contact_facebook_icon"
                                    value={settings.contact_facebook_icon}
                                    onChange={handleChange}
                                    placeholder="URL icon tùy chỉnh..."
                                    style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
                                />
                                <div style={{ position: 'relative', overflow: 'hidden', display: 'inline-block' }}>
                                    <button type="button" className="btn" style={{ fontSize: '0.8rem', padding: '0.5rem' }}>Upload</button>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, 'contact_facebook_icon')}
                                        style={{ position: 'absolute', left: 0, top: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* YouTube */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <label style={{ fontWeight: '500' }}>YouTube URL</label>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Mặc định: YouTube</span>
                            </div>
                            <input
                                type="url"
                                name="contact_youtube"
                                value={settings.contact_youtube}
                                onChange={handleChange}
                                placeholder="https://youtube.com/..."
                                className="form-input"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', marginBottom: '0.5rem' }}
                            />
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    name="contact_youtube_icon"
                                    value={settings.contact_youtube_icon}
                                    onChange={handleChange}
                                    placeholder="URL icon tùy chỉnh..."
                                    style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
                                />
                                <div style={{ position: 'relative', overflow: 'hidden', display: 'inline-block' }}>
                                    <button type="button" className="btn" style={{ fontSize: '0.8rem', padding: '0.5rem' }}>Upload</button>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, 'contact_youtube_icon')}
                                        style={{ position: 'absolute', left: 0, top: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Contact Section - Dynamic List */}
                <section style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 'semibold' }}>
                            ➕ Liên hệ Bổ sung (Tùy chỉnh)
                        </h2>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => {
                                setContacts([...contacts, { id: Date.now().toString(), text: '', link: '', icon: '' }]);
                            }}
                            style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}
                        >
                            + Thêm liên hệ
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {contacts.length === 0 && (
                            <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center' }}>
                                Chưa có thông tin liên hệ nào. Nhấn "Thêm liên hệ" để bắt đầu.
                            </p>
                        )}
                        {contacts.map((contact, index) => (
                            <div key={contact.id} style={{
                                padding: '1rem',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                background: 'var(--bg-primary)',
                                position: 'relative'
                            }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setContacts(contacts.filter(c => c.id !== contact.id));
                                    }}
                                    style={{
                                        position: 'absolute',
                                        top: '0.5rem',
                                        right: '0.5rem',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '1.2rem',
                                        opacity: 0.6
                                    }}
                                    title="Xóa"
                                >
                                    🗑️
                                </button>
                                <h3 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.8rem', color: 'var(--text-secondary)' }}>Mục #{index + 1}</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Nội dung hiển thị</label>
                                        <input
                                            type="text"
                                            value={contact.text}
                                            onChange={(e) => {
                                                const newContacts = [...contacts];
                                                newContacts[index].text = e.target.value;
                                                setContacts(newContacts);
                                            }}
                                            placeholder="VD: 0123 456 789"
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Liên kết (Tùy chọn)</label>
                                        <input
                                            type="text"
                                            value={contact.link}
                                            onChange={(e) => {
                                                const newContacts = [...contacts];
                                                newContacts[index].link = e.target.value;
                                                setContacts(newContacts);
                                            }}
                                            placeholder="VD: tel:0123456789 hoặc https://..."
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                                        />
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Icon (URL hoặc Tải lên)</label>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <input
                                                type="text"
                                                value={contact.icon}
                                                onChange={(e) => {
                                                    const newContacts = [...contacts];
                                                    newContacts[index].icon = e.target.value;
                                                    setContacts(newContacts);
                                                }}
                                                placeholder="URL icon..."
                                                style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                                            />
                                            <div style={{ position: 'relative', overflow: 'hidden', display: 'inline-block' }}>
                                                <button type="button" className="btn" style={{ fontSize: '0.8rem', padding: '0.5rem' }}>Upload</button>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;
                                                        if (file.size > 100 * 1024) { // 100KB limit for icons
                                                            alert('Icon phải nhỏ hơn 100KB');
                                                            return;
                                                        }
                                                        const reader = new FileReader();
                                                        reader.onload = (ev) => {
                                                            const newContacts = [...contacts];
                                                            newContacts[index].icon = ev.target?.result as string;
                                                            setContacts(newContacts);
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }}
                                                    style={{ position: 'absolute', left: 0, top: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                                                />
                                            </div>
                                        </div>
                                        {contact.icon && (
                                            <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#eee', display: 'inline-block', borderRadius: '4px' }}>
                                                <img src={contact.icon} alt="Icon preview" style={{ height: '24px', width: '24px', objectFit: 'contain' }} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="btn btn-primary"
                        style={{ minWidth: '150px' }}
                    >
                        {isSaving ? 'Đang lưu...' : 'Lưu cài đặt'}
                    </button>
                </div>
            </form>
        </div >
    );
}
