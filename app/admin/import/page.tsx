'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import VietnameseFileInput from '@/components/VietnameseFileInput';

interface ExtractedItem {
    word: string;
    type: string;
    definitions: string[];
    synonyms: string[];
    antonyms: string[];
}

export default function ImportPage() {
    // Add a key to reset file inputs
    const [resetKey, setResetKey] = useState(0);
    const [file, setFile] = useState<File | null>(null);
    const [guideFile, setGuideFile] = useState<File | null>(null);
    const [isThinking, setIsThinking] = useState(false);
    const [extractedData, setExtractedData] = useState<ExtractedItem[]>([]);
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const [isImporting, setIsImporting] = useState(false);
    const [importResults, setImportResults] = useState<any[]>([]);
    const [sourceName, setSourceName] = useState('');
    const [availableSources, setAvailableSources] = useState<string[]>([]);
    const [importProgress, setImportProgress] = useState(0);
    const [totalImportCount, setTotalImportCount] = useState(0);
    const [extractProgress, setExtractProgress] = useState(0);

    useEffect(() => {
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setExtractedData([]);
            setSelectedIndices(new Set());
            setImportResults([]);
        }
    };

    const handleGuideFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setGuideFile(e.target.files[0]);
        }
    };

    const handleExtract = async () => {
        if (!file) return;

        setIsThinking(true);
        setExtractProgress(0);

        // Simulated progress with decaying increment
        const progressInterval = setInterval(() => {
            setExtractProgress((prev) => {
                if (prev >= 95) return prev;

                let increment = 0;
                if (prev < 30) {
                    increment = Math.random() * 5 + 2; // Fast start
                } else if (prev < 70) {
                    increment = Math.random() * 2 + 1; // Medium pace
                } else {
                    increment = Math.random() * 0.5; // Very slow crawl at the end
                }

                return Math.min(prev + increment, 95);
            });
        }, 500); // Slower update tick

        try {
            const formData = new FormData();
            formData.append('file', file);
            if (guideFile) {
                formData.append('guideFile', guideFile);
            }

            const res = await fetch('/api/admin/extract', {
                method: 'POST',
                body: formData,
            });

            const json = await res.json();

            clearInterval(progressInterval);
            setExtractProgress(100);

            if (json.data) {
                setExtractedData(json.data);
                // Auto-select all by default
                setSelectedIndices(new Set(json.data.map((_: any, i: number) => i)));
            } else {
                const errorMessage = json.error || 'Lỗi không xác định';
                const detail = json.raw ? `\n\nPhản hồi gốc:\n${json.raw.substring(0, 500)}...` : '';
                alert(`Trích xuất thất bại: ${errorMessage}${detail}`);
            }
        } catch (err) {
            console.error(err);
            alert('Trích xuất thất bại');
        } finally {
            clearInterval(progressInterval);
            setIsThinking(false);
        }
    };

    const handleDataChange = (index: number, field: keyof ExtractedItem, value: any) => {
        const newData = [...extractedData];
        if (field === 'synonyms' || field === 'antonyms') {
            newData[index] = { ...newData[index], [field]: value.split(',').map((s: string) => s.trim()) };
        } else if (field === 'definitions') {
            newData[index] = { ...newData[index], definitions: value.split('\n').filter((d: string) => d.trim()) };
        } else {
            newData[index] = { ...newData[index], [field]: value };
        }
        setExtractedData(newData);
    };

    const toggleSelection = (index: number) => {
        const newSet = new Set(selectedIndices);
        if (newSet.has(index)) {
            newSet.delete(index);
        } else {
            newSet.add(index);
        }
        setSelectedIndices(newSet);
    };

    const handleImport = async () => {
        if (selectedIndices.size === 0) return;
        if (!sourceName.trim()) {
            alert('Vui lòng thêm nguồn');
            return;
        }

        setIsImporting(true);
        setImportResults([]);

        const dataToImport = extractedData.filter((_, i) => selectedIndices.has(i));
        setTotalImportCount(dataToImport.length);
        setImportProgress(0);

        const BATCH_SIZE = 1; // Process one by one for smooth progress updates
        const allResults = [];

        try {
            for (let i = 0; i < dataToImport.length; i += BATCH_SIZE) {
                const batch = dataToImport.slice(i, i + BATCH_SIZE);

                const res = await fetch('/api/admin/import', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imports: batch, sourceName }),
                });

                const json = await res.json();
                const batchResults = json.results || [];
                allResults.push(...batchResults);

                // Update progress immediately after batch completes
                setImportResults(prev => [...prev, ...batchResults]);
                setImportProgress(Math.min(i + BATCH_SIZE, dataToImport.length));
            }

            alert('Đã xử lý nhập liệu!');

            // Reset to initial state
            setFile(null);
            setGuideFile(null);
            setExtractedData([]);
            setSelectedIndices(new Set());
            setImportResults([]);
            setImportProgress(0);
            setTotalImportCount(0);
            setSourceName('');
            setResetKey(prev => prev + 1); // Force re-render of file inputs to clear them

        } catch (err) {
            console.error(err);
            alert('Nhập liệu thất bại (có thể một số mục đã được nhập)');
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Nhập từ điển bằng AI</h1>

            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <div className="flex gap-4">
                    <div className="flex-1 flex flex-col gap-12">
                        <div className="mb-8">
                            <label className="label text-sm font-semibold">Tệp từ điển (Ảnh, PDF, Excel, CSV)</label>
                            <VietnameseFileInput
                                key={`file-${resetKey}`}
                                accept="image/*,application/pdf,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                                onChange={handleFileChange}
                                className="w-full max-w-xs"
                            />
                        </div>
                        <div>
                            <label className="label text-sm font-semibold">Giải nghĩa ký hiệu (Không bắt buộc, Ảnh)</label>
                            <VietnameseFileInput
                                key={`guide-${resetKey}`}
                                accept="image/*"
                                onChange={handleGuideFileChange}
                                className="w-full max-w-xs"
                            />
                        </div>
                    </div>
                    <div className="flex items-center">
                        <button
                            onClick={handleExtract}
                            disabled={!file || isThinking}
                            className="btn btn-primary h-full max-h-32"
                        >
                            {isThinking ? 'Đang phân tích...' : 'Trích xuất dữ liệu'}
                        </button>
                    </div>
                </div>
                {isThinking && (
                    <div className="mt-4 w-full">
                        <div className="flex justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <span className="loading loading-spinner loading-xs text-primary"></span>
                                <span className="text-sm font-medium text-gray-700">Đang phân tích...</span>
                            </div>
                            <span className="text-sm font-medium text-blue-600">{Math.round(extractProgress)}%</span>
                        </div>
                        <progress
                            className="progress progress-primary w-full"
                            value={extractProgress}
                            max="100"
                        ></progress>
                        <p className="mt-2 text-sm text-gray-500 text-center">Đang gửi đến Gemini AI... Quá trình này có thể mất vài giây.</p>
                    </div>
                )}
            </div>

            {extractedData.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-semibold">Kiểm tra dữ liệu ({extractedData.length} mục)</h2>
                            <input
                                placeholder="Nguồn (VD: Từ điển 1930)"
                                className="input input-bordered input-sm w-64"
                                value={sourceName}
                                onChange={(e) => setSourceName(e.target.value)}
                                list="sources-list"
                            />
                            <datalist id="sources-list">
                                {availableSources.map((src, i) => (
                                    <option key={i} value={src} />
                                ))}
                            </datalist>
                        </div>
                        <button
                            onClick={handleImport}
                            disabled={isImporting || selectedIndices.size === 0}
                            className="btn btn-success text-white"
                        >
                            {isImporting ? 'Đang nhập...' : `Nhập ${selectedIndices.size} mục đã chọn`}
                        </button>
                    </div>

                    {isImporting && (
                        <div className="mb-4">
                            <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-blue-700">Đang tiến hành nhập liệu...</span>
                                <div className="flex items-center gap-2">
                                    <span className="loading loading-spinner loading-xs text-blue-700"></span>
                                    <span className="text-sm font-medium text-blue-700">{Math.round((importProgress / totalImportCount) * 100)}%</span>
                                </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
                                    style={{ width: `${(importProgress / totalImportCount) * 100}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 text-right">{importProgress} / {totalImportCount} mục</p>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="table w-full">
                            <thead>
                                <tr>
                                    <th>
                                        <label>
                                            <input
                                                type="checkbox"
                                                className="checkbox"
                                                checked={selectedIndices.size === extractedData.length}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedIndices(new Set(extractedData.map((_, i) => i)));
                                                    } else {
                                                        setSelectedIndices(new Set());
                                                    }
                                                }}
                                            />
                                        </label>
                                    </th>
                                    <th>Từ vựng</th>
                                    <th>Loại từ</th>
                                    <th>Định nghĩa (Mỗi dòng 1 nghĩa)</th>
                                    <th>Đồng nghĩa</th>
                                    <th>Trái nghĩa</th>
                                </tr>
                            </thead>
                            <tbody>
                                {extractedData.map((item, index) => (
                                    <tr key={index} className="hover">
                                        <td>
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    className="checkbox"
                                                    checked={selectedIndices.has(index)}
                                                    onChange={() => toggleSelection(index)}
                                                />
                                            </label>
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                value={item.word}
                                                onChange={(e) => handleDataChange(index, 'word', e.target.value)}
                                                className="input input-bordered input-sm w-full"
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                value={item.type}
                                                onChange={(e) => handleDataChange(index, 'type', e.target.value)}
                                                className="input input-bordered input-sm w-20"
                                            />
                                        </td>
                                        <td>
                                            <textarea
                                                value={item.definitions?.join('\n')}
                                                onChange={(e) => handleDataChange(index, 'definitions', e.target.value)}
                                                className="textarea textarea-bordered textarea-sm w-full"
                                                rows={item.definitions?.length || 1}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                value={item.synonyms?.join(', ')}
                                                onChange={(e) => handleDataChange(index, 'synonyms', e.target.value)}
                                                className="input input-bordered input-sm w-full"
                                                placeholder="Đồng nghĩa..."
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                value={item.antonyms?.join(', ')}
                                                onChange={(e) => handleDataChange(index, 'antonyms', e.target.value)}
                                                className="input input-bordered input-sm w-full"
                                                placeholder="Trái nghĩa..."
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {importResults.length > 0 && (
                <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-bold mb-4">Kết quả nhập liệu ({importResults.length})</h3>
                    <div className="max-h-60 overflow-y-auto">
                        {importResults.map((res, i) => (
                            <div key={i} className={`text-sm ${res.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                {res.status === 'success' ? `✅ Đã nhập: ${res.word}` : `❌ Thất bại: ${res.word} - ${res.error}`}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
