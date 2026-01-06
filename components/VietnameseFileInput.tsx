'use client';

import { useRef, useState } from 'react';

interface VietnameseFileInputProps {
    accept?: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string; // For compatibility, though we might not fully use it if it conflicts with custom styling
}

export default function VietnameseFileInput({ accept, onChange, className }: VietnameseFileInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = useState<string>('Chưa chọn tệp');

    const handleClick = () => {
        inputRef.current?.click();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFileName(e.target.files[0].name);
        } else {
            setFileName('Chưa chọn tệp');
        }
        onChange(e); // Propagate event
    };

    return (
        <div className={`flex items-center gap-2 ${className || ''}`} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
                type="file"
                ref={inputRef}
                accept={accept}
                onChange={handleChange}
                style={{ display: 'none' }}
            />
            <button
                type="button"
                onClick={handleClick}
                className="btn"
                style={{
                    backgroundColor: '#e5e7eb',
                    border: '1px solid #d1d5db',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    color: '#374151',
                    fontWeight: 500
                }}
            >
                Chọn tệp
            </button>
            <span style={{ fontSize: '0.875rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                {fileName}
            </span>
        </div>
    );
}
