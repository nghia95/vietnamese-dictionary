'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import styles from './addWord.module.css';

interface DefinitionInput {
    definition: string;
    source: string;
}

export default function AddWordPage() {
    const [word, setWord] = useState('');
    const [phonetic, setPhonetic] = useState('');
    const [definitions, setDefinitions] = useState<DefinitionInput[]>([
        { definition: '', source: '' }
    ]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { data: session } = useSession();

    const handleAddDefinition = () => {
        setDefinitions([...definitions, { definition: '', source: '' }]);
    };

    const handleRemoveDefinition = (index: number) => {
        if (definitions.length > 1) {
            setDefinitions(definitions.filter((_, i) => i !== index));
        }
    };

    const handleDefinitionChange = (index: number, field: 'definition' | 'source', value: string) => {
        const newDefinitions = [...definitions];
        newDefinitions[index][field] = value;
        setDefinitions(newDefinitions);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (!word) {
            setError('Vui lòng nhập từ vựng');
            return;
        }

        // Validate definitions
        const validDefinitions = definitions.filter(
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
                    word,
                    phonetic: phonetic || null,
                    definitions: validDefinitions
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Đã xảy ra lỗi');
            } else {
                setSuccess(true);
                setWord('');
                setPhonetic('');
                setDefinitions([{ definition: '', source: '' }]);

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

                        <div className={styles.definitionsSection}>
                            <div className={styles.definitionsSectionHeader}>
                                <label>Nghĩa <span style={{ color: 'var(--accent-pink)' }}>*</span></label>
                                <p className={styles.helperText}>Thêm nhiều nghĩa từ các nguồn khác nhau</p>
                            </div>

                            <div className={styles.definitionsList}>
                                {definitions.map((def, index) => (
                                    <div key={index} className={styles.definitionEntry}>
                                        <div className={styles.definitionHeader}>
                                            <span className={styles.definitionNumber}>Nghĩa #{index + 1}</span>
                                            {definitions.length > 1 && (
                                                <button
                                                    type="button"
                                                    className={styles.removeButton}
                                                    onClick={() => handleRemoveDefinition(index)}
                                                    title="Xóa nghĩa này"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor={`definition-${index}`}>Nghĩa</label>
                                            <textarea
                                                id={`definition-${index}`}
                                                value={def.definition}
                                                onChange={(e) => handleDefinitionChange(index, 'definition', e.target.value)}
                                                placeholder="Nhập nghĩa của từ..."
                                                rows={3}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor={`source-${index}`}>Nguồn</label>
                                            <input
                                                id={`source-${index}`}
                                                type="text"
                                                value={def.source}
                                                onChange={(e) => handleDefinitionChange(index, 'source', e.target.value)}
                                                placeholder="Ví dụ: Từ điển Việt-Anh, Wikipedia, Community"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                className={styles.addDefinitionButton}
                                onClick={handleAddDefinition}
                            >
                                ➕ Thêm nghĩa khác
                            </button>
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
