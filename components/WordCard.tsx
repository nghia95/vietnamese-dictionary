import { Word } from '@/types';
import styles from './WordCard.module.css';

interface WordCardProps {
    word: Word;
}

export default function WordCard({ word }: WordCardProps) {
    const formattedDate = new Date(word.created_at).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className={`card ${styles.wordCard}`}>
            <div className={styles.wordHeader}>
                <h3 className={styles.wordTitle}>{word.word}</h3>
                {word.phonetic && (
                    <span className={styles.phonetic}>/{word.phonetic}/</span>
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

            <div className={styles.wordMeta}>
                {word.user_name && (
                    <span className={styles.contributor}>
                        Được thêm bởi: <strong>{word.user_name}</strong>
                    </span>
                )}
                <span className={styles.date}>{formattedDate}</span>
            </div>
        </div>
    );
}
