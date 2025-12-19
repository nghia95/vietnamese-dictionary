export const runtime = 'nodejs';

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getAllFeedbacks } from '@/lib/db';
import styles from './page.module.css';
import FeedbackList from './FeedbackList';

export default async function AdminFeedbackPage() {
    const session = await auth();
    if (!session || (session.user?.role !== 'admin' && session.user?.role !== 'moderator')) {
        redirect('/login');
    }

    const feedbacks = await getAllFeedbacks();

    return (
        <div className="container" style={{ padding: '2rem 0' }}>
            <h1 className={styles.title}>Quản lý Phản hồi ({feedbacks.length})</h1>

            <FeedbackList initialFeedbacks={feedbacks.filter(f => f.status !== 'resolved')} />
        </div>
    );
}

