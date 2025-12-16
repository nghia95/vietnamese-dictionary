import { Word } from '@/types';
import styles from './WordCard.module.css';

interface WordCardProps {
    word: Word;
    currentUserId?: number | null;
}

export default function WordCard({ word, currentUserId }: WordCardProps) {
    const formattedDate = new Date(word.created_at).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className={`card ${styles.wordCard}`}>
            <div className={styles.wordHeader}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'baseline', gap: '1rem', flexWrap: 'wrap' }}>
                    <h3 className={styles.wordTitle}>{word.word}</h3>
                    {word.phonetic && (
                        <span className={styles.phonetic}>/{word.phonetic}/</span>
                    )}
                </div>
                {currentUserId && word.user_id === currentUserId && (
                    <a href={`/edit-word/${word.id}`} className={styles.editButton} title="Chỉnh sửa từ này">
                        ✏️
                    </a>
                )}
            </div>

            <div className={styles.definitionsList}>
                {word.definitions.map((def, index) => (
                    <div key={def.id} className={styles.definitionItem}>
                        <div className={styles.definitionText}>
                            <span className={styles.definitionNumber}>{index + 1}.</span>
                            {def.definition}
                        </div>
                        <div className={styles.definitionSource}>
                            Nguồn: {def.source}
                        </div>
                    </div>
                ))}
            </div>

            {word.etymologies && word.etymologies.length > 0 && (
                <div className={styles.etymologySection}>
                    <h4 className={styles.sectionTitle}>Nguồn gốc</h4>
                    {word.etymologies.map((etym, index) => (
                        <p key={index} className={styles.etymologyText}>{etym}</p>
                    ))}
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
                {word.user_name && (
                    <span className={styles.contributor}>
                        Được thêm bởi: <strong>{word.user_name}</strong>
                    </span>
                )}
                <span className={styles.date} suppressHydrationWarning>{formattedDate}</span>
            </div>
        </div>
    );
}
