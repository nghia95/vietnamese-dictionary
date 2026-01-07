'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import styles from './Header.module.css';

export default function Header() {
    const { data: session, status } = useSession();
    const { user } = useUser();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isAddWordDropdownOpen, setIsAddWordDropdownOpen] = useState(false);
    const [logoText, setLogoText] = useState('Từ điển tiếng Việt');
    const [logoImage, setLogoImage] = useState('');
    const [logoType, setLogoType] = useState<'text' | 'image'>('text');
    const [logoSize, setLogoSize] = useState('40');

    const dropdownRef = useRef<HTMLDivElement>(null);
    const addWordDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
            if (addWordDropdownRef.current && !addWordDropdownRef.current.contains(event.target as Node)) {
                setIsAddWordDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);

        // Fetch settings for logo
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data.settings) {
                    if (data.settings.logo_text) setLogoText(data.settings.logo_text);
                    if (data.settings.logo_image) setLogoImage(data.settings.logo_image);
                    if (data.settings.logo_type) setLogoType(data.settings.logo_type as 'text' | 'image');
                    if (data.settings.logo_size) setLogoSize(data.settings.logo_size);
                }
            })
            .catch(console.error);

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const displayName = user?.name || session?.user?.name;
    const displayAvatar = user?.avatar;
    const isAdminOrMod = session?.user?.role === 'admin' || session?.user?.role === 'moderator';

    return (
        <header className={styles.header}>
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
                <a href="/" className={styles.logo} style={logoType === 'text' ? { fontSize: `${Math.max(16, parseInt(logoSize) / 2)}px` } : {}}>
                    {logoType === 'image' && logoImage ? (
                        <img src={logoImage} alt={logoText} style={{ height: `${logoSize}px`, width: 'auto', objectFit: 'contain' }} />
                    ) : (
                        <>
                            <span className={styles.logoIcon}>📖</span>
                            {logoText}
                        </>
                    )}
                </a>

                <nav className={styles.nav}>
                    {status === 'loading' ? (
                        <div style={{ width: '100px', height: '36px' }}></div>
                    ) : session ? (
                        <>
                            {/* Add Word Dropdown */}
                            {isAdminOrMod && (
                                <div className={styles.dropdownContainer} ref={addWordDropdownRef}>
                                    <button
                                        className={`btn btn-primary`}
                                        onClick={() => setIsAddWordDropdownOpen(!isAddWordDropdownOpen)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                    >
                                        <span>➕</span>
                                        <span>Thêm từ mới</span>
                                        <span style={{ fontSize: '0.8em' }}>▼</span>
                                    </button>

                                    {isAddWordDropdownOpen && (
                                        <div className={styles.dropdownMenu}>
                                            <Link
                                                href="/add-word"
                                                className={styles.dropdownItem}
                                                onClick={() => setIsAddWordDropdownOpen(false)}
                                            >
                                                ✍️ Nhập thủ công
                                            </Link>
                                            <Link
                                                href="/admin/import"
                                                className={styles.dropdownItem}
                                                onClick={() => setIsAddWordDropdownOpen(false)}
                                            >
                                                ✨ Nhập tự động (AI)
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* User Dropdown */}
                            <div className={styles.dropdownContainer} ref={dropdownRef}>
                                <button
                                    className={`${styles.dropdownToggle} ${isDropdownOpen ? styles.active : ''}`}
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                >
                                    {displayAvatar ? (
                                        <img src={displayAvatar} alt="" className={styles.headerAvatar} />
                                    ) : (
                                        <span>👤</span>
                                    )}
                                    <span className={styles.userName}>{displayName}</span>
                                    <span style={{ fontSize: '0.8em' }}>▼</span>
                                </button>

                                {isDropdownOpen && (
                                    <div className={styles.dropdownMenu}>
                                        <Link
                                            href="/account"
                                            className={styles.dropdownItem}
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            👤 Tài khoản
                                        </Link>
                                        <Link
                                            href="/account/history"
                                            className={styles.dropdownItem}
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            🕒 Lịch sử
                                        </Link>
                                        <Link
                                            href="/settings"
                                            className={styles.dropdownItem}
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            ⚙️ Cài đặt
                                        </Link>

                                        {/* Admin Links inside User Dropdown */}
                                        {isAdminOrMod && (
                                            <>
                                                <div className={styles.dropdownDivider}></div>
                                                <Link
                                                    href="/admin/users"
                                                    className={styles.dropdownItem}
                                                    onClick={() => setIsDropdownOpen(false)}
                                                >
                                                    👥 Quản lý người dùng
                                                </Link>
                                                <Link
                                                    href="/admin/feedbacks"
                                                    className={styles.dropdownItem}
                                                    onClick={() => setIsDropdownOpen(false)}
                                                >
                                                    💬 Phản hồi
                                                </Link>
                                                <Link
                                                    href="/admin/settings"
                                                    className={styles.dropdownItem}
                                                    onClick={() => setIsDropdownOpen(false)}
                                                >
                                                    🔧 Cài đặt Trang chủ
                                                </Link>
                                                <Link
                                                    href="/admin/sources"
                                                    className={styles.dropdownItem}
                                                    onClick={() => setIsDropdownOpen(false)}
                                                >
                                                    📚 Tài liệu tham khảo
                                                </Link>
                                            </>
                                        )}

                                        <div className={styles.dropdownDivider}></div>
                                        <button
                                            onClick={() => signOut()}
                                            className={styles.dropdownItem}
                                            style={{ color: '#ef4444' }}
                                        >
                                            🚪 Đăng xuất
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="btn btn-secondary">
                                Đăng nhập
                            </Link>
                            <Link href="/signup" className="btn btn-primary">
                                Đăng ký
                            </Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}
