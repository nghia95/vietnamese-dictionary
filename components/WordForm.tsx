'use client';

import { useState, useEffect } from 'react';
import styles from '@/app/add-word/addWord.module.css';

export interface DefinitionInput {
    definition: string;
    source: string;
}

export interface WordData {
    word: string;
    phonetic: string;
    definitions: DefinitionInput[];
    etymologies: string[];
    synonyms: string;
    antonyms: string;
}

interface WordFormProps {
    initialData?: WordData;
    onSubmit: (data: WordData) => Promise<void>;
    isLoading: boolean;
    error: string;
    success: boolean;
    submitLabel: string;
    onCancel: () => void;
    contributorName?: string | null;
}

export default function WordForm({
    initialData,
    onSubmit,
    isLoading,
    error,
    success,
    submitLabel,
    onCancel,
    contributorName
}: WordFormProps) {
    const [word, setWord] = useState('');
    const [phonetic, setPhonetic] = useState('');
    const [definitions, setDefinitions] = useState<DefinitionInput[]>([
        { definition: '', source: '' }
    ]);
    const [etymologies, setEtymologies] = useState<string[]>(['']);
    const [synonyms, setSynonyms] = useState('');
    const [antonyms, setAntonyms] = useState('');

    useEffect(() => {
        if (initialData) {
            setWord(initialData.word);
            setPhonetic(initialData.phonetic);
            setDefinitions(initialData.definitions);
            setEtymologies(initialData.etymologies.length > 0 ? initialData.etymologies : ['']);
            setSynonyms(initialData.synonyms);
            setAntonyms(initialData.antonyms);
        }
    }, [initialData]);

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

    const handleEtymologyChange = (index: number, value: string) => {
        const newEtymologies = [...etymologies];
        newEtymologies[index] = value;
        setEtymologies(newEtymologies);
    };

    const handleAddEtymology = () => {
        setEtymologies([...etymologies, '']);
    };

    const handleRemoveEtymology = (index: number) => {
        if (etymologies.length > 1) {
            setEtymologies(etymologies.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            word,
            phonetic,
            definitions,
            etymologies: etymologies.filter(e => e.trim() !== ''),
            synonyms,
            antonyms
        });
    };

    return (
        <div className={styles.addWordContainer}>
            {error && (
                <div className="alert alert-error">{error}</div>
            )}

            {success && (
                <div className="alert alert-success">
                    ✅ Thao tác thành công! Đang chuyển hướng...
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

                <div className={styles.definitionsSection}>
                    <div className={styles.definitionsSectionHeader}>
                        <label>Nguồn gốc (Etymology)</label>
                        <p className={styles.helperText}>Thêm nguồn gốc của từ (tùy chọn)</p>
                    </div>

                    <div className={styles.definitionsList}>
                        {etymologies.map((etym, index) => (
                            <div key={index} className={styles.definitionEntry}>
                                <div className={styles.definitionHeader}>
                                    <span className={styles.definitionNumber}>Mục #{index + 1}</span>
                                    {etymologies.length > 1 && (
                                        <button
                                            type="button"
                                            className={styles.removeButton}
                                            onClick={() => handleRemoveEtymology(index)}
                                            title="Xóa mục này"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>

                                <div className="form-group">
                                    <textarea
                                        value={etym}
                                        onChange={(e) => handleEtymologyChange(index, e.target.value)}
                                        placeholder="Nhập nguồn gốc..."
                                        rows={2}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        className={styles.addDefinitionButton}
                        onClick={handleAddEtymology}
                    >
                        ➕ Thêm nguồn gốc khác
                    </button>
                </div>

                <div className="form-group">
                    <label htmlFor="synonyms">Từ đồng nghĩa (ngăn cách bằng dấu phẩy)</label>
                    <input
                        id="synonyms"
                        type="text"
                        value={synonyms}
                        onChange={(e) => setSynonyms(e.target.value)}
                        placeholder="Ví dụ: chào, xin, kính chào"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="antonyms">Từ trái nghĩa (ngăn cách bằng dấu phẩy)</label>
                    <input
                        id="antonyms"
                        type="text"
                        value={antonyms}
                        onChange={(e) => setAntonyms(e.target.value)}
                        placeholder="Ví dụ: tạm biệt"
                    />
                </div>

                <div className={styles.formActions}>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={onCancel}
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isLoading}
                    >
                        {isLoading ? <span className="loading"></span> : submitLabel}
                    </button>
                </div>
            </form>

            {contributorName && (
                <div className={styles.contributorInfo}>
                    <span>👤</span>
                    <p>
                        Từ này sẽ được ghi nhận với tên <strong>{contributorName}</strong>
                    </p>
                </div>
            )}
        </div>
    );
}
