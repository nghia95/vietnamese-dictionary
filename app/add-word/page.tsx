'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import styles from './addWord.module.css';

export default function AddWordPage() {
    const [word, setWord] = useState('');
    const [phonetic, setPhonetic] = useState('');
    const [definition, setDefinition] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { data: session } = useSession();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (!word || !definition) {
            setError('Vui lòng điền đầy đủ từ và nghĩa');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/words', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ word, definition, phonetic }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Đã xảy ra lỗi');
            } else {
                setSuccess(true);
                setWord('');
                setPhonetic('');
                setDefinition('');

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
                <div className={styles.addWordContainer}>
                    <div className={styles.addWordHeader}>
                        <h1>Thêm từ mới</h1>
                        <p>Đóng góp từ vựng tiếng Việt vào từ điển</p>
                    </div>

                    {error && (
                        <div className="alert alert-error">{error}</div>
                    )}

                    {success && (
                        <div className="alert alert-success">
                            ✅ Đã thêm từ thành công! Đang chuyển về trang chủ...
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className={styles.addWordForm}>
                        <div className="form-group">
                            <label htmlFor="word">Từ vựng <span style={{ color: 'var(--accent-pink)' }}>*</span></label>
                            <input
                                id="word"
                                type="text"
                                value={word}
                                onChange={(e) => setWord(e.target.value)}
                                required
                                placeholder="Ví dụ: xin chào"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="phonetic">Phiên âm (tùy chọn)</label>
                            <input
                                id="phonetic"
                                type="text"
                                value={phonetic}
                                onChange={(e) => setPhonetic(e.target.value)}
                                placeholder="Ví dụ: sin chào"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="definition">Nghĩa <span style={{ color: 'var(--accent-pink)' }}>*</span></label>
                            <textarea
                                id="definition"
                                value={definition}
                                onChange={(e) => setDefinition(e.target.value)}
                                required
                                placeholder="Nhập nghĩa của từ..."
                                rows={5}
                            />
                        </div>

                        <div className={styles.formActions}>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => router.push('/')}
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isLoading}
                            >
                                {isLoading ? <span className="loading"></span> : 'Thêm từ'}
                            </button>
                        </div>
                    </form>

                    {session?.user && (
                        <div className={styles.contributorInfo}>
                            <span>👤</span>
                            <p>
                                Từ này sẽ được ghi nhận với tên <strong>{session.user.name}</strong>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
