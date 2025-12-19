'use client';

import { useState } from 'react';
import styles from './page.module.css';

interface Feedback {
    id: number;
    word_id: number | null;
    word_text: string | null;
    user_id: number;
    user_name: string;
    user_email: string;
    content: string;
    status: string;
    created_at: string;
}

interface FeedbackListProps {
    initialFeedbacks: Feedback[];
}

export default function FeedbackList({ initialFeedbacks }: FeedbackListProps) {
    const [feedbacks, setFeedbacks] = useState(initialFeedbacks);

    const handleResolve = async (id: number) => {
        if (!confirm('Bạn có muốn đánh dấu phản hồi này là đã giải quyết?')) return;

        try {
            const res = await fetch(`/api/feedback/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'resolved' })
            });

            if (res.ok) {
                // Remove from list or update status
                setFeedbacks(prev => prev.filter(fb => fb.id !== id));
            } else {
                alert('Có lỗi xảy ra');
            }
        } catch (error) {
            console.error(error);
            alert('Lỗi kết nối');
        }
    };

    if (feedbacks.length === 0) {
        return <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có phản hồi nào (hoặc đã giải quyết hết).</p>;
    }

    return (
        <div className={styles.grid}>
            {feedbacks.map(fb => (
                <div key={fb.id} className={styles.card}>
                    <div className={styles.header}>
                        <span className={`${styles.status} ${styles[fb.status]}`}>{fb.status}</span>
                        <span className={styles.date}>{new Date(fb.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>

                    {fb.word_text && (
                        <div className={styles.targetWord}>
                            Từ: <strong>{fb.word_text}</strong>
                        </div>
                    )}

                    <p className={styles.content}>{fb.content}</p>

                    <div className={styles.user}>
                        👤 {fb.user_name} ({fb.user_email})
                    </div>

                    <button
                        className={styles.resolveButton}
                        onClick={() => handleResolve(fb.id)}
                    >
                        ✅ Đã giải quyết
                    </button>
                </div>
            ))}
        </div>
    );
}
