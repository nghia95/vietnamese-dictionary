'use client';

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import styles from './account.module.css';

export default function AccountLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    if (status === 'loading') {
        return (
            <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>
                <div className="loading"></div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    const navItems = [
        { href: '/account', label: 'Tổng quan', icon: '📊' },
        { href: '/account/history', label: 'Lịch sử', icon: '🕒' },
    ];

    return (
        <div className={styles.accountLayout}>
            <aside className={styles.sidebar}>
                <h2 className={styles.sidebarTitle}>👤 Tài khoản</h2>
                <nav className={styles.navLinks}>
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.navLink} ${pathname === item.href ? styles.navLinkActive : ''
                                }`}
                        >
                            <span className={styles.navIcon}>{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </aside>
            <main className={styles.mainContent}>
                {children}
            </main>
        </div>
    );
}
