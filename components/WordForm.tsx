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

interface SourceGroup {
    id: number;
    source: string;
    definitions: { id: number; text: string }[];
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
    // Grouped state
    const [sourceGroups, setSourceGroups] = useState<SourceGroup[]>([
        { id: Date.now(), source: '', definitions: [{ id: Date.now() + 1, text: '' }] }
    ]);
    const [availableSources, setAvailableSources] = useState<string[]>([]);

    const [etymologies, setEtymologies] = useState<string[]>(['']);
    const [synonyms, setSynonyms] = useState('');
    const [antonyms, setAntonyms] = useState('');

    useEffect(() => {
        // Fetch available sources
        const fetchSources = async () => {
            try {
                const res = await fetch('/api/sources');
                if (res.ok) {
                    const data = await res.json();
                    setAvailableSources(data.sources || []);
                }
            } catch (err) {
                console.error('Failed to fetch sources', err);
            }
        };
        fetchSources();
    }, []);

    useEffect(() => {
        if (initialData) {
            setWord(initialData.word);
            setPhonetic(initialData.phonetic);

            // Reconstruct source groups from flat definitions
            const groups: SourceGroup[] = [];
            const processedSources = new Set<string>();

            // Group by source
            const groupedDefs: Record<string, string[]> = {};
            initialData.definitions.forEach(def => {
                const src = def.source || 'Community';
                if (!groupedDefs[src]) groupedDefs[src] = [];
                groupedDefs[src].push(def.definition);
            });

            Object.entries(groupedDefs).forEach(([source, texts], idx) => {
                groups.push({
                    id: Date.now() + idx,
                    source,
                    definitions: texts.map((text, i) => ({ id: Date.now() + idx + i + 100, text }))
                });
            });

            if (groups.length === 0) {
                groups.push({ id: Date.now(), source: '', definitions: [{ id: Date.now() + 1, text: '' }] });
            }

            setSourceGroups(groups);
            setEtymologies(initialData.etymologies.length > 0 ? initialData.etymologies : ['']);
            setSynonyms(initialData.synonyms);
            setAntonyms(initialData.antonyms);
        }
    }, [initialData]);

    // --- Source Group Handlers ---

    const handleAddSourceGroup = () => {
        setSourceGroups([
            ...sourceGroups,
            { id: Date.now(), source: '', definitions: [{ id: Date.now() + 1, text: '' }] }
        ]);
    };

    const handleRemoveSourceGroup = (index: number) => {
        if (sourceGroups.length > 1) {
            setSourceGroups(sourceGroups.filter((_, i) => i !== index));
        }
    };

    const handleSourceChange = (index: number, value: string) => {
        const newGroups = [...sourceGroups];
        newGroups[index].source = value;
        setSourceGroups(newGroups);
    };

    // --- Definition Handlers (inside a group) ---

    const handleAddDefinitionToGroup = (groupIndex: number) => {
        const newGroups = [...sourceGroups];
        newGroups[groupIndex].definitions.push({ id: Date.now(), text: '' });
        setSourceGroups(newGroups);
    };

    const handleRemoveDefinitionFromGroup = (groupIndex: number, defIndex: number) => {
        const newGroups = [...sourceGroups];
        if (newGroups[groupIndex].definitions.length > 1) {
            newGroups[groupIndex].definitions = newGroups[groupIndex].definitions.filter((_, i) => i !== defIndex);
            setSourceGroups(newGroups);
        }
    };

    const handleDefinitionChange = (groupIndex: number, defIndex: number, value: string) => {
        const newGroups = [...sourceGroups];
        newGroups[groupIndex].definitions[defIndex].text = value;
        setSourceGroups(newGroups);
    };

    // --- Etymology Handlers ---

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

        // Flatten SourceGroups back to DefinitionInput[]
        const flatDefinitions: DefinitionInput[] = [];
        sourceGroups.forEach(group => {
            const finalSource = group.source.trim() || 'Community';
            group.definitions.forEach(def => {
                if (def.text.trim()) {
                    flatDefinitions.push({
                        definition: def.text.trim(),
                        source: finalSource
                    });
                }
            });
        });

        if (flatDefinitions.length === 0) {
            alert('Vui lòng nhập ít nhất một định nghĩa');
            return;
        }

        onSubmit({
            word,
            phonetic,
            definitions: flatDefinitions,
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
                        <label>Nghĩa & Nguồn <span style={{ color: 'var(--accent-pink)' }}>*</span></label>
                        <p className={styles.helperText}>Nhập nguồn, sau đó thêm các nghĩa thuộc nguồn đó.</p>
                    </div>

                    <div className={styles.definitionsList}>
                        {sourceGroups.map((group, groupIndex) => (
                            <div key={group.id} className={styles.sourceGroup} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', marginBottom: '15px', background: 'var(--bg-secondary)' }}>
                                <div className={styles.definitionHeader} style={{ marginBottom: '10px' }}>
                                    <span className={styles.definitionNumber}>Nguồn #{groupIndex + 1}</span>
                                    {sourceGroups.length > 1 && (
                                        <button
                                            type="button"
                                            className={styles.removeButton}
                                            onClick={() => handleRemoveSourceGroup(groupIndex)}
                                            title="Xóa nguồn này"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>

                                {/* Source Selector */}
                                <div className="form-group">
                                    <label>Chọn hoặc nhập Nguồn</label>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input
                                            type="text"
                                            list={`sources-list-${groupIndex}`}
                                            value={group.source}
                                            onChange={(e) => handleSourceChange(groupIndex, e.target.value)}
                                            placeholder="Ví dụ: Từ điển Việt-Anh"
                                            style={{ flex: 1 }}
                                        />
                                        <datalist id={`sources-list-${groupIndex}`}>
                                            {availableSources.map((src, i) => (
                                                <option key={i} value={src} />
                                            ))}
                                        </datalist>
                                    </div>
                                </div>

                                {/* Definitions in this source */}
                                <div style={{ marginLeft: '20px', borderLeft: '2px solid var(--accent-blue)', paddingLeft: '15px' }}>
                                    {group.definitions.map((def, defIndex) => (
                                        <div key={def.id} className="form-group" style={{ marginBottom: '10px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <label htmlFor={`def-${group.id}-${def.id}`} style={{ fontSize: '0.9em' }}>Nghĩa #{defIndex + 1}</label>
                                                {group.definitions.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveDefinitionFromGroup(groupIndex, defIndex)}
                                                        style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', fontSize: '1.2em' }}
                                                    >
                                                        &times;
                                                    </button>
                                                )}
                                            </div>
                                            <textarea
                                                id={`def-${group.id}-${def.id}`}
                                                value={def.text}
                                                onChange={(e) => handleDefinitionChange(groupIndex, defIndex, e.target.value)}
                                                placeholder="Nhập nghĩa..."
                                                rows={2}
                                            />
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={() => handleAddDefinitionToGroup(groupIndex)}
                                        style={{ fontSize: '0.9em', color: 'var(--accent-blue)', background: 'none', border: '1px dashed var(--accent-blue)', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        + Thêm nghĩa cho nguồn này
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        className={styles.addDefinitionButton}
                        onClick={handleAddSourceGroup}
                    >
                        ➕ Thêm Nguồn Khác
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
