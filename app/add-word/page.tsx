'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import styles from './addWord.module.css';
import WordForm, { WordData } from '@/components/WordForm';

export default function AddWordPage() {
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { data: session } = useSession();

    const handleSubmit = async (data: WordData) => {
        setError('');
        setSuccess(false);

        // Validate definitions
        const validDefinitions = data.definitions.filter(
            d => d.definition.trim() !== '' && d.source.trim() !== ''
        );

        if (validDefinitions.length === 0) {
            setError('Vui lòng nhập ít nhất một nghĩa và nguồn');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/words', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    word: data.word,
                    phonetic: data.phonetic || null,
                    definitions: validDefinitions,
                    etymologies: data.etymologies,
                    synonyms: data.synonyms ? data.synonyms.split(',').map(s => s.trim()).filter(s => s !== '') : [],
                    antonyms: data.antonyms ? data.antonyms.split(',').map(s => s.trim()).filter(s => s !== '') : []
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                setError(result.error || 'Đã xảy ra lỗi');
            } else {
                setSuccess(true);
                // Redirect to home after success
                setTimeout(() => {
                    router.push('/');
                }, 2000);
            }
        } catch (err) {
            setError('Đã xảy ra lỗi. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.addWordPage}>
            <div className="container">
                <div className={styles.addWordHeader}>
                    <h1>Thêm từ mới</h1>
                    <p>Đóng góp từ vựng tiếng Việt vào từ điển</p>
                </div>

                <WordForm
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                    error={error}
                    success={success}
                    submitLabel="Thêm từ"
                    onCancel={() => router.push('/')}
                    contributorName={session?.user?.name}
                />
            </div>
        </div>
    );
}
