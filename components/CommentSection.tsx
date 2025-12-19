'use client';

import { useState, useEffect } from 'react';
import styles from './CommentSection.module.css';

interface Comment {
    id: number;
    word_id: number;
    user_id: number;
    user_name: string;
    content: string;
    parent_id: number | null;
    likes_count: number;
    is_hidden: boolean;
    is_liked: boolean;
    created_at: string;
}

interface CommentSectionProps {
    wordId: number;
    currentUserRole?: string;
    isLoggedIn: boolean;
}

export default function CommentSection({ wordId, currentUserRole, isLoggedIn }: CommentSectionProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [replyContent, setReplyContent] = useState('');
    const [replyingTo, setReplyingTo] = useState<number | null>(null);

    const fetchComments = async () => {
        try {
            const res = await fetch(`/api/comments?wordId=${wordId}`);
            if (res.ok) {
                const data = await res.json();
                setComments(data.comments || []);
            }
        } catch (error) {
            console.error('Failed to load comments', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [wordId]);

    const handlePostComment = async (parentId?: number) => {
        if (!replyContent.trim()) return;

        try {
            const res = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wordId, content: replyContent, parentId })
            });

            if (res.ok) {
                setReplyContent('');
                setReplyingTo(null);
                fetchComments();
            } else {
                alert('Có lỗi xảy ra khi đăng bình luận');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleLike = async (commentId: number) => {
        if (!isLoggedIn) return alert('Vui lòng đăng nhập để thích bình luận');

        // Optimistic update
        setComments(current => current.map(c => {
            if (c.id === commentId) {
                return {
                    ...c,
                    likes_count: c.is_liked ? c.likes_count - 1 : c.likes_count + 1,
                    is_liked: !c.is_liked
                };
            }
            return c;
        }));

        try {
            await fetch(`/api/comments/${commentId}/like`, { method: 'POST' });
        } catch (error) {
            // Revert on error
            fetchComments();
        }
    };

    const handleDelete = async (commentId: number) => {
        if (!confirm('Bạn chắc chắn muốn xóa bình luận này?')) return;
        try {
            await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
            fetchComments();
        } catch (error) {
            alert('Lỗi xóa bình luận');
        }
    };

    // Recursive render
    const renderComments = (parentId: number | null = null, depth = 0) => {
        const list = comments.filter(c => c.parent_id === parentId);
        if (list.length === 0) return null;

        return list.map(comment => (
            <div key={comment.id} className={styles.commentItem} style={{ marginLeft: depth > 0 ? '20px' : '0' }}>
                <div className={styles.commentHeader}>
                    <strong>{comment.user_name}</strong>
                    <span className={styles.date}>{new Date(comment.created_at).toLocaleDateString('vi-VN')}</span>
                </div>

                {comment.is_hidden && currentUserRole !== 'admin' ? (
                    <p className={styles.hiddenText}>[Bình luận đã bị ẩn]</p>
                ) : (
                    <>
                        <p className={styles.commentContent} style={{ opacity: comment.is_hidden ? 0.5 : 1 }}>
                            {comment.content}
                        </p>

                        <div className={styles.actions}>
                            <button onClick={() => handleLike(comment.id)} className={`${styles.actionBtn} ${comment.is_liked ? styles.liked : ''}`}>
                                👍 {comment.likes_count}
                            </button>

                            {isLoggedIn && (
                                <button onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)} className={styles.actionBtn}>
                                    💬 Trả lời
                                </button>
                            )}

                            {currentUserRole === 'admin' && (
                                <button onClick={() => handleDelete(comment.id)} className={styles.deleteBtn}>
                                    🗑️ Xóa
                                </button>
                            )}
                        </div>

                        {replyingTo === comment.id && (
                            <div className={styles.replyBox}>
                                <input
                                    value={replyContent}
                                    onChange={e => setReplyContent(e.target.value)}
                                    placeholder="Viết câu trả lời..."
                                    className={styles.input}
                                />
                                <button onClick={() => handlePostComment(comment.id)} className="btn btn-primary btn-sm">Gửi</button>
                            </div>
                        )}
                    </>
                )}
                {renderComments(comment.id, depth + 1)}
            </div>
        ));
    };

    return (
        <div className={styles.container}>
            <h4 className={styles.title}>Bình luận ({comments.length})</h4>

            {loading ? <p>Đang tải...</p> : (
                <div className={styles.list}>
                    {renderComments(null)}
                </div>
            )}

            {isLoggedIn ? (
                <div className={styles.postBox}>
                    <textarea
                        value={replyingTo ? '' : replyContent}
                        onChange={e => !replyingTo && setReplyContent(e.target.value)}
                        placeholder="Viết bình luận của bạn..."
                        className={styles.textarea}
                        disabled={!!replyingTo}
                    />
                    {!replyingTo && (
                        <button onClick={() => handlePostComment()} className="btn btn-primary" style={{ marginTop: '10px' }}>
                            Đăng bình luận
                        </button>
                    )}
                    {replyingTo && <p style={{ fontSize: '0.9em', color: '#666' }}>Đang trả lời bình luận...</p>}
                </div>
            ) : (
                <p className={styles.loginPrompt}>Vui lòng đăng nhập để bình luận</p>
            )}
        </div>
    );
}
