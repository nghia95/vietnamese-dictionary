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
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const displayName = user?.name || session?.user?.name;
    const displayAvatar = user?.avatar;

    return (
        <header className={styles.header}>
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
                <a href="/" className={styles.logo}>
                    <span className={styles.logoIcon}>📖</span>
                    Từ điển tiếng Việt
                </a>

                <nav className={styles.nav}>
                    {status === 'loading' ? (
                        <div style={{ width: '100px', height: '36px' }}></div>
                    ) : session ? (
                        <>
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

                            {(session.user?.role === 'admin' || session.user?.role === 'moderator') && (
                                <>
                                    <Link href="/add-word" className="btn btn-primary">
                                        Thêm từ mới
                                    </Link>
                                    <Link href="/admin/users" className="btn btn-secondary">
                                        Quản lý người dùng
                                    </Link>
                                    <Link href="/admin/feedbacks" className="btn btn-secondary" style={{ marginLeft: '10px' }}>
                                        Phản hồi
                                    </Link>
                                    <Link href="/admin/import" className="btn btn-secondary" style={{ marginLeft: '10px', backgroundColor: '#e0e7ff', color: '#4338ca', borderColor: '#c7d2fe' }}>
                                        ✨ AI Import
                                    </Link>
                                    <Link href="/admin/settings" className="btn btn-secondary" style={{ marginLeft: '10px' }}>
                                        ⚙️ Cài đặt Trang chủ
                                    </Link>
                                </>
                            )}
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
