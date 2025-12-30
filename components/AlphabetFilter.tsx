'use client';

import styles from './AlphabetFilter.module.css';

interface AlphabetFilterProps {
    selectedLetter: string | null;
    onSelectLetter: (letter: string | null) => void;
}

const ALPHABET = [
    'A', 'Ă', 'Â', 'B', 'C', 'D', 'Đ', 'E', 'Ê', 'G', 'H', 'I', 'K', 'L', 'M', 'N', 'O', 'Ô', 'Ơ', 'P', 'Q', 'R', 'S', 'T', 'U', 'Ư', 'V', 'X', 'Y'
];

export default function AlphabetFilter({ selectedLetter, onSelectLetter }: AlphabetFilterProps) {
    return (
        <div className={styles.container}>

            {ALPHABET.map((letter) => (
                <button
                    key={letter}
                    className={`${styles.letter} ${selectedLetter === letter ? styles.active : ''}`}
                    onClick={() => onSelectLetter(letter)}
                >
                    {letter}
                </button>
            ))}
        </div>
    );
}
