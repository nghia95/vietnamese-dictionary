'use client';

import { useState, useEffect } from 'react';
import WordCard from '@/components/WordCard';
import { Word } from '@/types';
import styles from './page.module.css';
import { useSession } from 'next-auth/react';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [words, setWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    // Load initial words
    fetchWords('');
  }, []);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchWords(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchWords = async (query: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/words?search=${encodeURIComponent(query)}`);
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
            Từ Điển Việt
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
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.resultsSection}>
        <div className="container">
          {isLoading ? (
            <div className={styles.loadingContainer}>
              <div className="loading"></div>
              <p>Đang tìm kiếm...</p>
            </div>
          ) : words.length > 0 ? (
            <>
              <h2 className={styles.resultsTitle}>
                {searchQuery
                  ? `Kết quả cho "${searchQuery}" (${words.length})`
                  : `Tất cả từ vựng (${words.length})`}
              </h2>
              <div className={styles.wordsGrid}>
                {words.map((word) => (
                  <WordCard
                    key={word.id}
                    word={word}
                    currentUserId={session?.user?.id ? parseInt(session.user.id) : null}
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
