'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ExtractedItem {
    word: string;
    type: string;
    definition: string;
    synonyms: string[];
}

export default function ImportPage() {
    const [file, setFile] = useState<File | null>(null);
    const [isThinking, setIsThinking] = useState(false);
    const [extractedData, setExtractedData] = useState<ExtractedItem[]>([]);
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const [isImporting, setIsImporting] = useState(false);
    const [importResults, setImportResults] = useState<any[]>([]);
    const [sourceName, setSourceName] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setExtractedData([]);
            setSelectedIndices(new Set());
            setImportResults([]);
        }
    };

    const handleExtract = async () => {
        if (!file) return;

        setIsThinking(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

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
                const errorMessage = json.error || 'Unknown error';
                const detail = json.raw ? `\n\nRaw response:\n${json.raw.substring(0, 500)}...` : '';
                alert(`Extraction failed: ${errorMessage}${detail}`);
            }
        } catch (err) {
            console.error(err);
            alert('Extraction failed');
        } finally {
            setIsThinking(false);
        }
    };

    const handleDataChange = (index: number, field: keyof ExtractedItem, value: any) => {
        const newData = [...extractedData];
        if (field === 'synonyms') {
            // Handle array conversion if needed, but for simple text input we might just keep as string and split later
            // For simplicity in this table, let's treat synonyms as comma-separated string for editing
            newData[index] = { ...newData[index], [field]: value.split(',').map((s: string) => s.trim()) };
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
            alert('Import processed!');
        } catch (err) {
            console.error(err);
            alert('Import failed');
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">AI Dictionary Import</h1>

            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <div className="flex items-center gap-4">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="file-input file-input-bordered w-full max-w-xs"
                    />
                    <button
                        onClick={handleExtract}
                        disabled={!file || isThinking}
                        className="btn btn-primary"
                    >
                        {isThinking ? 'Analyzing...' : 'Extract Data'}
                    </button>
                </div>
                {isThinking && <p className="mt-2 text-sm text-gray-500">Sending to Gemini AI... This may take a few seconds.</p>}
            </div>

            {extractedData.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-semibold">Review Data ({extractedData.length} items)</h2>
                            <input
                                type="text"
                                placeholder="Source Name (e.g. Từ điển 1930)"
                                className="input input-bordered input-sm w-64"
                                value={sourceName}
                                onChange={(e) => setSourceName(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={handleImport}
                            disabled={isImporting || selectedIndices.size === 0}
                            className="btn btn-success text-white"
                        >
                            {isImporting ? 'Importing...' : `Import Selected (${selectedIndices.size})`}
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
                                    <th>Word</th>
                                    <th>Type</th>
                                    <th>Definition</th>
                                    <th>Synonyms</th>
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
                                                value={item.definition}
                                                onChange={(e) => handleDataChange(index, 'definition', e.target.value)}
                                                className="textarea textarea-bordered textarea-sm w-full"
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                value={item.synonyms?.join(', ')}
                                                onChange={(e) => handleDataChange(index, 'synonyms', e.target.value)}
                                                className="input input-bordered input-sm w-full"
                                                placeholder="Comma separated"
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
                    <h3 className="text-lg font-bold mb-4">Import Results</h3>
                    <div className="max-h-60 overflow-y-auto">
                        {importResults.map((res, i) => (
                            <div key={i} className={`text-sm ${res.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                {res.status === 'success' ? `✅ Imported: ${res.word}` : `❌ Failed: ${res.word} - ${res.error}`}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
