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
    const [file, setFile] = useState<File | null>(null);
    const [guideFile, setGuideFile] = useState<File | null>(null);
    const [isThinking, setIsThinking] = useState(false);
    const [extractedData, setExtractedData] = useState<ExtractedItem[]>([]);
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const [isImporting, setIsImporting] = useState(false);
    const [importResults, setImportResults] = useState<any[]>([]);
    const [sourceName, setSourceName] = useState('');
    const [availableSources, setAvailableSources] = useState<string[]>([]);

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
        const dataToImport = extractedData.filter((_, i) => selectedIndices.has(i));

        try {
            const res = await fetch('/api/admin/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imports: dataToImport, sourceName }),
            });
            const json = await res.json();
            setImportResults(json.results || []);
            alert('Đã xử lý nhập liệu!');
        } catch (err) {
            console.error(err);
            alert('Nhập liệu thất bại');
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
                            <label className="label text-sm font-semibold">Tệp từ điển (Ảnh)</label>
                            <VietnameseFileInput
                                accept="image/*"
                                onChange={handleFileChange}
                                className="w-full max-w-xs"
                            />
                        </div>
                        <div>
                            <label className="label text-sm font-semibold">Giải nghĩa ký hiệu (Không bắt buộc, Ảnh)</label>
                            <VietnameseFileInput
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
                {isThinking && <p className="mt-2 text-sm text-gray-500">Đang gửi đến Gemini AI... Quá trình này có thể mất vài giây.</p>}
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
                    <h3 className="text-lg font-bold mb-4">Kết quả nhập liệu</h3>
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
