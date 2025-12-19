'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './history.module.css';

interface HistoryItem {
    id: number;
    type: 'SEARCH' | 'VIEW';
    query?: string;
    word_id?: number;
    word_text?: string;
    created_at: string;
}

export default function HistoryPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'SEARCH' | 'VIEW'>('SEARCH');
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            fetchHistory();
        }
    }, [status, activeTab]);

    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/history?type=${activeTab}`);
            const data = await res.json();
            if (data.history) {
                setHistory(data.history);
            }
        } catch (error) {
            console.error('Failed to fetch history', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearHistory = async () => {
        if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử này?')) return;

        try {
            const res = await fetch('/api/history', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: activeTab })
            });
            if (res.ok) {
                setHistory([]);
            }
        } catch (error) {
            console.error('Failed to clear history', error);
        }
    };

    if (status === 'loading') return <div className="container"><p className="loading"></p></div>;

    return (
        <div className={styles.historyPage}>
            <div className="container">
                <h1 className={styles.pageTitle}>Lịch sử hoạt động</h1>

                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'SEARCH' ? styles.active : ''}`}
                        onClick={() => setActiveTab('SEARCH')}
                    >
                        🔍 Tìm kiếm
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'VIEW' ? styles.active : ''}`}
                        onClick={() => setActiveTab('VIEW')}
                    >
                        👁️ Đã xem
                    </button>
                </div>

                <div className={styles.actions}>
                    <button className={styles.clearButton} onClick={handleClearHistory} disabled={history.length === 0}>
                        🗑️ Xóa lịch sử
                    </button>
                </div>

                {isLoading ? (
                    <div className="loading"></div>
                ) : (
                    <div className={styles.historyList}>
                        {history.length === 0 ? (
                            <p className={styles.emptyState}>Chưa có dữ liệu lịch sử.</p>
                        ) : (
                            history.map(item => (
                                <div key={item.id} className={styles.historyItem}>
                                    <span className={styles.time}>
                                        {new Date(item.created_at).toLocaleString('vi-VN')}
                                    </span>
                                    {item.type === 'SEARCH' ? (
                                        <div className={styles.content}>
                                            Tìm kiếm: <span className={styles.highlight}>"{item.query}"</span>
                                        </div>
                                    ) : (
                                        <div className={styles.content}>
                                            Đã xem từ: <a href={`/?q=${item.word_text}`} className={styles.link}>{item.word_text}</a>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
