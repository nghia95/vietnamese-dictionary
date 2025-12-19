'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import styles from './Header.module.css';

export default function Header() {
    const { data: session, status } = useSession();

    return (
        <header className={styles.header}>
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
                <Link href="/" className={styles.logo}>
                    <span className={styles.logoIcon}>📖</span>
                    Từ Điển Việt
                </Link>

                <nav className={styles.nav}>
                    {status === 'loading' ? (
                        <div style={{ width: '100px', height: '36px' }}></div>
                    ) : session ? (
                        <>
                            <span className={styles.userName}>Xin chào, {session.user?.name}</span>
                            {session.user?.role === 'admin' && (
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
                                </>
                            )}
                            <button onClick={() => signOut()} className="btn btn-ghost">
                                Đăng xuất
                            </button>
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
