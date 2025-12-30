'use client';

import { useState, useEffect } from 'react';
import WordCard from '@/components/WordCard';
import AlphabetFilter from '@/components/AlphabetFilter';
import { Word } from '@/types';
import styles from './page.module.css';
import { useSession } from 'next-auth/react';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();



  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchWords(searchQuery, selectedLetter);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedLetter]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value) {
      setSelectedLetter(null); // Clear letter filter when searching
    }
  };

  const handleLetterSelect = (letter: string | null) => {
    setSelectedLetter(letter);
    setSearchQuery(''); // Clear search when filtering by letter
  };

  const fetchWords = async (query: string, letter: string | null) => {
    if (!query && !letter) {
      setWords([]);
      return;
    }

    setIsLoading(true);
    try {
      let url = `/api/words?search=${encodeURIComponent(query)}`;
      if (letter) {
        url += `&letter=${encodeURIComponent(letter)}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      setWords(data.words || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.homePage}>
      <section className={styles.hero}>
        <div className="container">
          <h1 className={`${styles.heroTitle} animate-fade-in`}>
            Từ điển tiếng Việt
          </h1>
          <p className={`${styles.heroSubtitle} animate-fade-in`}>
            Khám phá và học tiếng Việt một cách hiện đại
          </p>

          <div className={`${styles.searchContainer} animate-fade-in`}>
            <div className={styles.searchBox}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Tìm kiếm từ vựng tiếng Việt..."
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && session?.user && searchQuery.trim()) {
                    fetch('/api/history', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ type: 'SEARCH', query: searchQuery.trim() })
                    }).catch(console.error);
                  }
                }}
                className={styles.searchInput}
              />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.resultsSection}>
        <div className="container">
          <AlphabetFilter selectedLetter={selectedLetter} onSelectLetter={handleLetterSelect} />

          {isLoading ? (
            <div className={styles.loadingContainer}>
              <div className="loading"></div>
              <p>Đang tìm kiếm...</p>
            </div>
          ) : words.length > 0 ? (
            <>
              {searchQuery && (
                <h2 className={styles.resultsTitle}>
                  Kết quả cho "{searchQuery}" ({words.length})
                </h2>
              )}
              {selectedLetter && (
                <h2 className={styles.resultsTitle}>
                  Từ bắt đầu bằng "{selectedLetter}" ({words.length})
                </h2>
              )}
              <div className={styles.wordsGrid}>
                {words.map((word) => (
                  <WordCard
                    key={word.id}
                    word={word}
                    currentUserRole={session?.user?.role}
                  />
                ))}
              </div>
            </>
          ) : searchQuery ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>📚</span>
              <h3>Không tìm thấy từ nào</h3>
              <p>Thử tìm kiếm với từ khóa khác hoặc thêm từ mới vào từ điển</p>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>📖</span>
              <h3>Chào mừng đến với Từ Điển Việt</h3>
              <p>Bắt đầu tìm kiếm từ vựng tiếng Việt ngay bây giờ</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
