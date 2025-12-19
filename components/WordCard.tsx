'use client';

import { useState, useEffect } from 'react';
import { Word } from '@/types';
import styles from './WordCard.module.css';
import CommentSection from './CommentSection';

interface WordCardProps {
    word: Word;
    currentUserRole?: string;
    currentUserId?: string; // Add this prop to parent usage too if needed, but for now we check role
}

export default function WordCard({ word, currentUserRole }: WordCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackContent, setFeedbackContent] = useState('');
    const [commentCount, setCommentCount] = useState(0);

    const isLoggedIn = !!currentUserRole;

    const formattedDate = new Date(word.created_at).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    useEffect(() => {
        // Fetch comment count
        fetch(`/api/comments?wordId=${word.id}`)
            .then(res => res.json())
            .then(data => {
                if (data.comments) setCommentCount(data.comments.length);
            })
            .catch(console.error);
    }, [word.id]);

    const handleFeedbackSubmit = async () => {
        if (!feedbackContent.trim()) return;
        try {
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wordId: word.id, content: feedbackContent })
            });
            if (res.ok) {
                alert('Cảm ơn bạn đã đóng góp ý kiến!');
                setShowFeedback(false);
                setFeedbackContent('');
            } else {
                alert('Lỗi khi gửi phản hồi');
            }
        } catch (error) {
            console.error(error);
        }
    };

    // --- content grouping logic (same as before) ---
    const groupedDefinitions = Object.entries(
        word.definitions.reduce((acc, def) => {
            const src = def.source || 'Community';
            if (!acc[src]) acc[src] = [];
            acc[src].push(def);
            return acc;
        }, {} as Record<string, typeof word.definitions>)
    );

    // --- truncation logic ---
    const MAX_GROUPS_VISIBLE = 1;
    const MAX_DEFS_PER_GROUP_VISIBLE = 2;
    const MAX_ETYMOLOGIES_VISIBLE = 1;

    const visibleGroups = isExpanded ? groupedDefinitions : groupedDefinitions.slice(0, MAX_GROUPS_VISIBLE);
    const visibleEtymologies = isExpanded
        ? word.etymologies
        : (word.etymologies?.slice(0, MAX_ETYMOLOGIES_VISIBLE) || []);

    // Check if we need a "See More" button
    const hasMoreDefinitions = groupedDefinitions.length > MAX_GROUPS_VISIBLE ||
        groupedDefinitions.some(([_, defs]) => defs.length > MAX_DEFS_PER_GROUP_VISIBLE);
    const hasMoreEtymologies = (word.etymologies?.length || 0) > MAX_ETYMOLOGIES_VISIBLE;
    const showSeeMore = !isExpanded && (hasMoreDefinitions || hasMoreEtymologies);

    const WordContent = () => (
        <>
            <div className={styles.wordHeader}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', flexWrap: 'wrap' }}>
                        <h3 className={styles.wordTitle}>{word.word}</h3>
                        {word.phonetic && (
                            <span className={styles.phonetic}>/{word.phonetic}/</span>
                        )}
                    </div>
                </div>

                {isLoggedIn && (
                    <button
                        className={`${styles.actionButton} ${styles.reportButton}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowFeedback(true);
                        }}
                        title="Báo lỗi / Góp ý">
                        🚩
                    </button>
                )}

                {(currentUserRole === 'admin' || currentUserRole === 'moderator') && (
                    <a
                        href={`/edit-word/${word.id}`}
                        className={styles.actionButton}
                        onClick={(e) => e.stopPropagation()}
                        title="Chỉnh sửa từ này">
                        ✏️
                    </a>
                )}
                {!isExpanded && (
                    <button
                        className={styles.actionButton}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded(true);
                            // Log view history
                            if (isLoggedIn) {
                                fetch('/api/history', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ type: 'VIEW', wordId: word.id })
                                }).catch(console.error);
                            }
                        }}
                        title="Xem toàn màn hình">
                        ⤢
                    </button>
                )}
            </div>

            {isExpanded && word.image && (
                <div style={{ marginBottom: '1.5rem' }}>
                    <img
                        src={word.image}
                        alt={`Minh họa cho ${word.word}`}
                        style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', display: 'block' }}
                    />
                </div>
            )}

            <div className={styles.definitionsList}>
                <h4 className={styles.sectionTitle}>Định nghĩa</h4>
                {visibleGroups.map(([source, definitions], groupIndex) => {
                    // Truncate definitions inside a group if not expanded
                    const shownDefs = isExpanded ? definitions : definitions.slice(0, MAX_DEFS_PER_GROUP_VISIBLE);
                    const remainingDefs = definitions.length - shownDefs.length;

                    return (
                        <div key={source} className={styles.definitionGroup} style={{ marginBottom: '1.5rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
                            <div className={styles.definitionSource} style={{ marginBottom: '0.8rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                                <span style={{ marginRight: '0.5rem' }}>📚</span>
                                Nguồn: <span style={{ color: 'var(--accent-blue)' }}>{source}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {shownDefs.map((def, index) => (
                                    <div key={def.id} className={styles.definitionItem} style={{ marginLeft: '1rem', borderLeft: '2px solid var(--border-color)', paddingLeft: '0.8rem' }}>
                                        <div className={styles.definitionText}>
                                            {definitions.length > 1 && (
                                                <span className={styles.definitionNumber} style={{ color: 'var(--text-secondary)', marginRight: '0.5rem' }}>{index + 1}.</span>
                                            )}
                                            {def.definition}
                                        </div>
                                    </div>
                                ))}
                                {!isExpanded && remainingDefs > 0 && (
                                    <div style={{ marginLeft: '1rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                                        ...và {remainingDefs} nghĩa khác
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {word.etymologies && word.etymologies.length > 0 && (
                <div className={styles.etymologySection}>
                    <h4 className={styles.sectionTitle}>Nguồn gốc</h4>
                    {visibleEtymologies.map((etym, index) => (
                        <p key={index} className={styles.etymologyText}>{etym}</p>
                    ))}
                    {!isExpanded && (word.etymologies.length - visibleEtymologies.length) > 0 && (
                        <p className={styles.etymologyText} style={{ color: 'var(--text-muted)' }}>...</p>
                    )}
                </div>
            )}

            {(word.synonyms?.length > 0 || word.antonyms?.length > 0) && (
                <div className={styles.relatedWordsSection}>
                    <h4 className={styles.sectionTitle}>Từ liên quan</h4>

                    {word.synonyms?.length > 0 && (
                        <div className={styles.relatedGroup}>
                            <span className={styles.relatedLabel}>Đồng nghĩa:</span>
                            <div className={styles.relatedList}>
                                {word.synonyms.map((syn, index) => (
                                    <span key={index} className={styles.relatedBadge}>{syn}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {word.antonyms?.length > 0 && (
                        <div className={styles.relatedGroup}>
                            <span className={styles.relatedLabel}>Trái nghĩa:</span>
                            <div className={styles.relatedList}>
                                {word.antonyms.map((ant, index) => (
                                    <span key={index} className={`${styles.relatedBadge} ${styles.antonym}`}>{ant}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className={styles.wordMeta}>
                {currentUserRole === 'admin' && word.user_name && (
                    <span className={styles.contributor}>
                        Được thêm bởi: <strong>{word.user_name}</strong>
                    </span>
                )}
                <span className={styles.date} suppressHydrationWarning>{formattedDate}</span>

                {!isExpanded && (
                    <div className={styles.commentCount}>
                        💬 {commentCount} bình luận
                    </div>
                )}
            </div>

            {showSeeMore && (
                <button className={styles.seeMoreButton} onClick={() => {
                    setIsExpanded(true);
                    if (isLoggedIn) {
                        fetch('/api/history', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ type: 'VIEW', wordId: word.id })
                        }).catch(console.error);
                    }
                }}>
                    Xem chi tiết ({groupedDefinitions.length} nguồn, {word.definitions.length} nghĩa)
                </button>
            )}

            {/* Render Comments only when expanded */}
            {isExpanded && (
                <CommentSection
                    wordId={word.id}
                    currentUserRole={currentUserRole}
                    isLoggedIn={isLoggedIn}
                />
            )}
        </>
    );

    return (
        <>
            {isExpanded ? (
                <>
                    <div className={`card ${styles.wordCard}`}>
                        {/* Placeholder behind modal to prevent layout shift */}
                    </div>
                    <div className={styles.modalOverlay} onClick={() => setIsExpanded(false)}>
                        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                            <button className={styles.closeButton} onClick={() => setIsExpanded(false)}>✕</button>
                            <WordContent />
                        </div>
                    </div>
                </>
            ) : (
                <div
                    className={`card ${styles.wordCard}`}
                    onClick={() => {
                        setIsExpanded(true);
                        if (isLoggedIn) {
                            fetch('/api/history', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ type: 'VIEW', wordId: word.id })
                            }).catch(console.error);
                        }
                    }}
                >
                    <WordContent />
                </div>
            )}

            {/* Feedback Modal */}
            {showFeedback && (
                <div className={styles.modalOverlay} onClick={() => setShowFeedback(false)}>
                    <div className={styles.authModal} onClick={(e) => e.stopPropagation()}>
                        <h3>Gửi phản hồi / Báo lỗi</h3>
                        <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
                            Vui lòng mô tả chi tiết vấn đề hoặc đóng góp của bạn cho từ "<strong>{word.word}</strong>".
                        </p>
                        <textarea
                            className={styles.textarea}
                            value={feedbackContent}
                            onChange={(e) => setFeedbackContent(e.target.value)}
                            placeholder="Nội dung phản hồi..."
                        />
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button className="btn" onClick={() => setShowFeedback(false)}>Hủy</button>
                            <button className="btn btn-primary" onClick={handleFeedbackSubmit}>Gửi phản hồi</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
