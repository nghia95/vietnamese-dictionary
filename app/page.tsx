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

  // Selection mode for merge feature
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedWordIds, setSelectedWordIds] = useState<number[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Dynamic Settings
  const [welcomeText, setWelcomeText] = useState('Chào mừng đến với Từ Điển Việt');
  const [welcomeImage, setWelcomeImage] = useState('📖');

  useEffect(() => {
    // Fetch settings
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          if (data.settings.home_welcome_text) setWelcomeText(data.settings.home_welcome_text);
          if (data.settings.home_welcome_image) setWelcomeImage(data.settings.home_welcome_image);
        }
      })
      .catch(console.error);
  }, []);



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

  const handleMerge = async () => {
    if (selectedWordIds.length < 2) {
      alert('Vui lòng chọn ít nhất 2 từ để hợp nhất');
      return;
    }

    setIsMerging(true);
    try {
      const response = await fetch('/api/admin/words/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordIds: selectedWordIds })
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message || 'Hợp nhất thành công!');
        setSelectedWordIds([]);
        setIsSelectionMode(false);
        // Refresh the word list
        fetchWords(searchQuery, selectedLetter);
      } else {
        alert(data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Merge error:', error);
      alert('Có lỗi xảy ra khi hợp nhất');
    } finally {
      setIsMerging(false);
    }
  };

  const handleDelete = async () => {
    if (selectedWordIds.length === 0) return;

    if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedWordIds.length} từ đã chọn? Hành động này không thể hoàn tác.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch('/api/admin/words/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordIds: selectedWordIds })
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message || 'Xóa thành công!');
        setSelectedWordIds([]);
        setIsSelectionMode(false);
        // Refresh the word list
        fetchWords(searchQuery, selectedLetter);
      } else {
        alert(data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Có lỗi xảy ra khi xóa');
    } finally {
      setIsDeleting(false);
    }
  };

  // ... (I will switch to multi_replace in the next turn)

  // WAIT, I am the model. I can just output the tool call I want.
  // I will switch to `multi_replace_file_content`.


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

              {/* Selection Mode Toggle for Admin/Moderator */}
              {(session?.user?.role === 'admin' || session?.user?.role === 'moderator') && (
                <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    className="btn"
                    onClick={() => {
                      setIsSelectionMode(!isSelectionMode);
                      setSelectedWordIds([]);
                    }}
                    style={{
                      background: isSelectionMode ? 'var(--accent-blue)' : 'var(--bg-secondary)',
                      color: isSelectionMode ? 'white' : 'var(--text-primary)'
                    }}
                  >
                    {isSelectionMode ? '✓ Chế độ chọn' : '☑ Chế độ chọn'}
                  </button>
                  {isSelectionMode && selectedWordIds.length > 0 && (
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Đã chọn: {selectedWordIds.length}
                    </span>
                  )}
                </div>
              )}

              <div className={styles.wordsGrid}>
                {words.map((word) => (
                  <WordCard
                    key={word.id}
                    word={word}
                    currentUserRole={session?.user?.role}
                    isSelectable={isSelectionMode}
                    isSelected={selectedWordIds.includes(word.id)}
                    onToggleSelect={() => {
                      setSelectedWordIds(prev =>
                        prev.includes(word.id)
                          ? prev.filter(id => id !== word.id)
                          : [...prev, word.id]
                      );
                    }}
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
              <span className={styles.emptyIcon}>
                {welcomeImage.startsWith('http') || welcomeImage.startsWith('data:image') ? (
                  <img src={welcomeImage} alt="Welcome" style={{ height: '3rem', width: 'auto' }} />
                ) : (
                  welcomeImage
                )}
              </span>
              <h3>{welcomeText}</h3>
              <p>Bắt đầu tìm kiếm từ vựng tiếng Việt ngay bây giờ</p>
            </div>
          )}
        </div>
      </section>

      {/* Merge Action Bar */}
      {isSelectionMode && selectedWordIds.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--bg-secondary)',
          borderTop: '2px solid var(--accent-blue)',
          padding: '1rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
          zIndex: 1000,
          boxShadow: '0 -4px 12px rgba(0,0,0,0.1)'
        }}>
          <span style={{ fontWeight: 'bold' }}>
            {selectedWordIds.length} từ được chọn
          </span>
          <button
            className="btn btn-primary"
            onClick={handleMerge}
            disabled={isMerging || isDeleting}
            style={{
              background: 'var(--accent-green)',
              opacity: (isMerging || isDeleting) ? 0.7 : 1,
              cursor: (isMerging || isDeleting) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {isMerging ? (
              <>
                <span className="loading-spinner" style={{ width: '1em', height: '1em', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                Đang hợp nhất...
              </>
            ) : (
              <>🔗 Hợp nhất</>
            )}
          </button>
          <button
            className="btn"
            onClick={handleDelete}
            disabled={isMerging || isDeleting}
            style={{
              background: 'var(--accent-pink)',
              color: 'white',
              opacity: (isMerging || isDeleting) ? 0.7 : 1,
              cursor: (isMerging || isDeleting) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {isDeleting ? (
              <>
                <span className="loading-spinner" style={{ width: '1em', height: '1em', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                Đang xóa...
              </>
            ) : (
              <>🗑️ Xoá từ</>
            )}
          </button>
          <button
            className="btn"
            onClick={() => setSelectedWordIds([])}
            disabled={isMerging || isDeleting}
          >
            Xóa chọn (Clear)
          </button>
        </div>
      )}
    </div>
  );
}
