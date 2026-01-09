
'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';

interface StatsData {
    totalUsers: number;
    totalWords: number;
    totalDefinitions: number;
    totalViews: number;
    totalActivities: number;
    popularWords: {
        id: number;
        word: string;
        views: number;
        image: string | null;
        phonetic: string | null;
    }[];
}

export default function StatsPage() {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch('/api/stats')
            .then(res => res.json())
            .then(data => {
                if (data.stats) {
                    setStats(data.stats);
                }
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, []);

    if (isLoading) {
        return (
            <div className="container loading-container" style={{ padding: '4rem 0', display: 'flex', justifyContent: 'center' }}>
                <div className="loading"></div>
            </div>
        );
    }

    if (!stats) return <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>Không thể tải dữ liệu thống kê.</div>;

    return (
        <div style={{ padding: '2rem 0', minHeight: '80vh', backgroundColor: 'var(--bg-secondary)' }}>
            <div className="container">
                <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem', background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Thống Kê Cộng Đồng
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                        Những con số ấn tượng từ cộng đồng học tiếng Việt của chúng ta
                    </p>
                </header>

                {/* Metrics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
                    <StatCard icon="👥" title="Thành viên" value={stats.totalUsers} color="blue" />
                    <StatCard icon="📚" title="Từ vựng" value={stats.totalWords} color="green" />
                    <StatCard icon="📖" title="Định nghĩa" value={stats.totalDefinitions} color="purple" />
                    <StatCard icon="👀" title="Lượt tra cứu" value={stats.totalViews} color="orange" />
                </div>

                {/* Popular Words Section */}
                <section style={{ backgroundColor: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.8rem' }}>🔥</span> Từ khóa phổ biến nhất
                    </h2>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                                    <th style={{ textAlign: 'left', padding: '1rem', color: '#6b7280', fontWeight: '600' }}>#</th>
                                    <th style={{ textAlign: 'left', padding: '1rem', color: '#6b7280', fontWeight: '600' }}>Từ vựng</th>
                                    <th style={{ textAlign: 'left', padding: '1rem', color: '#6b7280', fontWeight: '600' }}>Phiên âm</th>
                                    <th style={{ textAlign: 'right', padding: '1rem', color: '#6b7280', fontWeight: '600' }}>Lượt xem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.popularWords.map((word, index) => (
                                    <tr key={word.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '1rem', fontWeight: 'bold', color: index < 3 ? '#eab308' : '#9ca3af' }}>
                                            {index + 1}
                                        </td>
                                        <td style={{ padding: '1rem', fontWeight: '600', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                                            {word.word}
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                                            {word.phonetic ? `/${word.phonetic}/` : '-'}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--accent-blue)' }}>
                                            {word.views.toLocaleString('vi-VN')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
}

function StatCard({ icon, title, value, color }: { icon: string, title: string, value: number, color: string }) {
    const getColorRef = (c: string) => {
        switch (c) {
            case 'blue': return { bg: '#eff6ff', text: '#1e40af' };
            case 'green': return { bg: '#f0fdf4', text: '#166534' };
            case 'purple': return { bg: '#faf5ff', text: '#6b21a8' };
            case 'orange': return { bg: '#fff7ed', text: '#9a3412' };
            default: return { bg: '#f3f4f6', text: '#374151' };
        }
    };

    const theme = getColorRef(color);

    return (
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
                width: '3.5rem', height: '3.5rem', borderRadius: '50%',
                backgroundColor: theme.bg, color: theme.text,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.8rem'
            }}>
                {icon}
            </div>
            <div>
                <div style={{ color: '#6b7280', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.25rem' }}>{title}</div>
                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1f2937' }}>
                    {value.toLocaleString('vi-VN')}
                </div>
            </div>
        </div>
    );
}
