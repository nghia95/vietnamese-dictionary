'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import styles from './account.module.css';

interface Stats {
    searchCount: number;
    viewCount: number;
}

export default function AccountDashboard() {
    const { data: session } = useSession();
    const [stats, setStats] = useState<Stats>({ searchCount: 0, viewCount: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch search history count
                const searchRes = await fetch('/api/history?type=SEARCH');
                const searchData = await searchRes.json();

                // Fetch view history count
                const viewRes = await fetch('/api/history?type=VIEW');
                const viewData = await viewRes.json();

                setStats({
                    searchCount: searchData.history?.length || 0,
                    viewCount: viewData.history?.length || 0,
                });
            } catch (error) {
                console.error('Failed to fetch stats', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    const isAdmin = session?.user?.role === 'admin' || session?.user?.role === 'moderator';

    return (
        <div className={styles.dashboard}>
            <div className={styles.dashboardHeader}>
                <h1 className={styles.welcomeTitle}>
                    Xin chào, {session?.user?.name}! 👋
                </h1>
                <p className={styles.welcomeSubtitle}>
                    Chào mừng bạn quay trở lại với Từ điển tiếng Việt
                </p>
            </div>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <span className={styles.statIcon}>🔍</span>
                    <div className={styles.statInfo}>
                        <h3>{isLoading ? '...' : stats.searchCount}</h3>
                        <p>Lượt tìm kiếm</p>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statIcon}>👁️</span>
                    <div className={styles.statInfo}>
                        <h3>{isLoading ? '...' : stats.viewCount}</h3>
                        <p>Từ đã xem</p>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statIcon}>📧</span>
                    <div className={styles.statInfo}>
                        <h3 style={{ fontSize: '1rem', wordBreak: 'break-all' }}>
                            {session?.user?.email}
                        </h3>
                        <p>Email</p>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statIcon}>🏷️</span>
                    <div className={styles.statInfo}>
                        <h3 style={{ textTransform: 'capitalize' }}>
                            {session?.user?.role || 'User'}
                        </h3>
                        <p>Vai trò</p>
                    </div>
                </div>
            </div>

            <div className={styles.quickActions}>
                <h2 className={styles.sectionTitle}>Thao tác nhanh</h2>
                <div className={styles.actionGrid}>
                    <Link href="/" className={styles.actionButton}>
                        🔍 Tìm kiếm từ
                    </Link>
                    <Link href="/account/history" className={styles.actionButton}>
                        🕒 Xem lịch sử
                    </Link>
                    <Link href="/settings" className={styles.actionButton}>
                        ⚙️ Cài đặt
                    </Link>
                    {isAdmin && (
                        <>
                            <Link href="/add-word" className={styles.actionButton}>
                                ➕ Thêm từ mới
                            </Link>
                            <Link href="/admin/users" className={styles.actionButton}>
                                👥 Quản lý người dùng
                            </Link>
                            <Link href="/admin/feedbacks" className={styles.actionButton}>
                                💬 Xem phản hồi
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
