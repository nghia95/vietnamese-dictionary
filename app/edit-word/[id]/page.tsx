'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import styles from '@/app/add-word/addWord.module.css';
import WordForm, { WordData } from '@/components/WordForm';
import { Word } from '@/types';

export default function EditWordPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [word, setWord] = useState<WordData | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const router = useRouter();
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }

        const fetchWord = async () => {
            try {
                const response = await fetch(`/api/words/${id}`);
                const data = await response.json();

                if (response.ok) {
                    const fetchedWord: Word = data.word;

                    // Enforce admin or moderator role
                    if (session?.user?.role !== 'admin' && session?.user?.role !== 'moderator') {
                        setError('Bạn không có quyền truy cập trang này');
                        setIsFetching(false);
                        return;
                    }



                    setWord({
                        word: fetchedWord.word,
                        phonetic: fetchedWord.phonetic || '',
                        image: fetchedWord.image || '',
                        definitions: fetchedWord.definitions.map(d => ({ definition: d.definition, source: d.source })),
                        etymologies: fetchedWord.etymologies,
                        synonyms: fetchedWord.synonyms.join(', '),
                        antonyms: fetchedWord.antonyms.join(', ')
                    });
                } else {
                    setError(data.error || 'Không tìm thấy từ');
                }
            } catch (err) {
                setError('Đã xảy ra lỗi khi tải từ');
            } finally {
                setIsFetching(false);
            }
        };

        if (id && status === 'authenticated') {
            fetchWord();
        }
    }, [id, router, status, session]);

    const handleSubmit = async (data: WordData) => {
        setError('');
        setSuccess(false);

        const validDefinitions = data.definitions.filter(
            d => d.definition.trim() !== '' && d.source.trim() !== ''
        );

        if (validDefinitions.length === 0) {
            setError('Vui lòng nhập ít nhất một nghĩa và nguồn');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`/api/words/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    word: data.word,
                    phonetic: data.phonetic || null,
                    image: data.image || null,
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

    if (status === 'loading' || isFetching) {
        return (
            <div className={styles.addWordPage}>
                <div className="container">
                    <div className="loading"></div>
                    <p style={{ textAlign: 'center', marginTop: '1rem' }}>Đang tải...</p>
                </div>
            </div>
        );
    }

    if (!word && error) {
        return (
            <div className={styles.addWordPage}>
                <div className="container">
                    <div className="alert alert-error">{error}</div>
                    <button className="btn btn-secondary" onClick={() => router.push('/')}>Về trang chủ</button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.addWordPage}>
            <div className="container">
                <div className={styles.addWordHeader}>
                    <h1>Chỉnh sửa từ</h1>
                    <p>Cập nhật thông tin cho từ vựng</p>
                </div>

                <WordForm
                    initialData={word || undefined}
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                    error={error}
                    success={success}
                    submitLabel="Lưu thay đổi"
                    onCancel={() => router.push('/')}
                />
            </div>
        </div>
    );
}
