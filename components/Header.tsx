'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import styles from './Header.module.css';

export default function Header() {
    const { data: session } = useSession();

    return (
        <header className={styles.header}>
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
                <Link href="/" className={styles.logo}>
                    <span className={styles.logoIcon}>📖</span>
                    Từ Điển Việt
                </Link>

                <nav className={styles.nav}>
                    {session ? (
                        <>
                            <span className={styles.userName}>Xin chào, {session.user?.name}</span>
                            <Link href="/add-word" className="btn btn-primary">
                                Thêm từ mới
                            </Link>
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
