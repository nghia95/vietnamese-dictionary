'use client';

import { useState, useEffect, useRef } from 'react';
import WordCard from '@/components/WordCard';
import AlphabetFilter from '@/components/AlphabetFilter';
import Footer from '@/components/Footer';
import { Word } from '@/types';
import styles from './page.module.css';
import { useSession } from 'next-auth/react';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();

  // Autocomplete
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const CARDS_PER_PAGE = 20;

  // Selection mode for merge feature
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedWordIds, setSelectedWordIds] = useState<number[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Dynamic Settings
  const [heroTitle, setHeroTitle] = useState('Từ điển tiếng Việt');
  const [heroSubtitle, setHeroSubtitle] = useState('Khám phá và học tiếng Việt một cách hiện đại');
  const [searchPlaceholder, setSearchPlaceholder] = useState('Tìm kiếm từ vựng tiếng Việt...');

  // Ref for scrolling to top of results
  const resultsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Fetch settings
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          if (data.settings.hero_title) setHeroTitle(data.settings.hero_title);
          if (data.settings.hero_subtitle) setHeroSubtitle(data.settings.hero_subtitle);
          if (data.settings.search_placeholder) setSearchPlaceholder(data.settings.search_placeholder);
        }
      })
      .catch(console.error);

    // Listen for reset home state event
    const handleReset = () => {
      setSearchQuery('');
      setSubmittedQuery('');
      setSelectedLetter(null);
      setWords([]);
      setShowSuggestions(false);
      setIsSelectionMode(false);
      setSelectedWordIds([]);
      setCurrentPage(1);
    };

    window.addEventListener('reset-home-state', handleReset);
    return () => window.removeEventListener('reset-home-state', handleReset);
  }, []);

  // Control page scrolling based on content
  useEffect(() => {
    if (words.length === 0 && !searchQuery && !selectedLetter) {
      // Disable scrolling on empty home page
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      // Enable scrolling when showing results
      document.documentElement.style.overflow = 'auto';
      document.body.style.overflow = 'auto';
    }

    // Cleanup
    return () => {
      document.documentElement.style.overflow = 'auto';
      document.body.style.overflow = 'auto';
    };
  }, [words.length, searchQuery, selectedLetter]);



  useEffect(() => {
    // Only debounce suggestions, not word search
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        fetchSuggestions(searchQuery);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    // Fetch words only when letter filter changes
    if (selectedLetter) {
      fetchWords('', selectedLetter);
    }
  }, [selectedLetter]);

  const fetchSuggestions = async (query: string) => {
    try {
      const response = await fetch(`/api/suggestions?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSuggestions(data.suggestions || []);
      setShowSuggestions((data.suggestions || []).length > 0);
      setSelectedSuggestionIndex(-1);
    } catch (error) {
      console.error('Suggestions error:', error);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value) {
      setSelectedLetter(null); // Clear letter filter when searching
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setSubmittedQuery(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
    setCurrentPage(1);
    // Fetch words when suggestion is clicked
    fetchWords(suggestion, null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      // Original Enter key logic for history
      if (e.key === 'Enter' && session?.user && searchQuery.trim()) {
        fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'SEARCH', query: searchQuery.trim() })
        }).catch(console.error);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSuggestionIndex >= 0) {
        handleSuggestionClick(suggestions[selectedSuggestionIndex]);
      } else if (searchQuery.trim()) {
        setShowSuggestions(false);
        setSubmittedQuery(searchQuery);
        setCurrentPage(1);
        // Fetch words and log to history
        fetchWords(searchQuery, null);
        if (session?.user) {
          fetch('/api/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'SEARCH', query: searchQuery.trim() })
          }).catch(console.error);
        }
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleLetterSelect = (letter: string | null) => {
    setSelectedLetter(letter);
    setSearchQuery(''); // Clear search when filtering by letter
    setSubmittedQuery('');
    setCurrentPage(1);
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

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    // Scroll to top of results
    if (resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  // Pagination component for reuse
  const PaginationControls = ({ compact = false }: { compact?: boolean }) => {
    if (words.length <= CARDS_PER_PAGE) return null;

    const totalPages = Math.ceil(words.length / CARDS_PER_PAGE);

    return (
      <div style={{
        display: 'flex',
        justifyContent: compact ? 'flex-end' : 'center',
        alignItems: 'center',
        gap: '0.5rem',
        flexWrap: 'wrap'
      }}>
        {!compact && (
          <button
            className="btn"
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            style={{
              opacity: currentPage === 1 ? 0.5 : 1,
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              fontSize: compact ? '0.875rem' : undefined,
              padding: compact ? '0.25rem 0.5rem' : undefined
            }}
          >
            ← Trước
          </button>
        )}

        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
          {(() => {
            const pages = [];

            // Show first page
            if (totalPages > 0) {
              pages.push(
                <button
                  key={1}
                  className="btn"
                  onClick={() => handlePageChange(1)}
                  style={{
                    background: currentPage === 1 ? 'var(--accent-blue)' : 'var(--bg-secondary)',
                    color: currentPage === 1 ? 'white' : 'var(--text-primary)',
                    minWidth: compact ? '2rem' : '2.5rem',
                    fontSize: compact ? '0.875rem' : undefined,
                    padding: compact ? '0.25rem 0.5rem' : undefined
                  }}
                >
                  1
                </button>
              );
            }

            // Show ellipsis if needed
            if (currentPage > 3 && !compact) {
              pages.push(<span key="ellipsis1" style={{ padding: '0 0.25rem' }}>...</span>);
            }

            // Show pages around current page
            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
              pages.push(
                <button
                  key={i}
                  className="btn"
                  onClick={() => handlePageChange(i)}
                  style={{
                    background: currentPage === i ? 'var(--accent-blue)' : 'var(--bg-secondary)',
                    color: currentPage === i ? 'white' : 'var(--text-primary)',
                    minWidth: compact ? '2rem' : '2.5rem',
                    fontSize: compact ? '0.875rem' : undefined,
                    padding: compact ? '0.25rem 0.5rem' : undefined
                  }}
                >
                  {i}
                </button>
              );
            }

            // Show ellipsis if needed
            if (currentPage < totalPages - 2 && !compact) {
              pages.push(<span key="ellipsis2" style={{ padding: '0 0.25rem' }}>...</span>);
            }

            // Show last page
            if (totalPages > 1) {
              pages.push(
                <button
                  key={totalPages}
                  className="btn"
                  onClick={() => handlePageChange(totalPages)}
                  style={{
                    background: currentPage === totalPages ? 'var(--accent-blue)' : 'var(--bg-secondary)',
                    color: currentPage === totalPages ? 'white' : 'var(--text-primary)',
                    minWidth: compact ? '2rem' : '2.5rem',
                    fontSize: compact ? '0.875rem' : undefined,
                    padding: compact ? '0.25rem 0.5rem' : undefined
                  }}
                >
                  {totalPages}
                </button>
              );
            }

            return pages;
          })()}
        </div>

        {!compact && (
          <>
            <button
              className="btn"
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              style={{
                opacity: currentPage === totalPages ? 0.5 : 1,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Sau →
            </button>

            <span style={{ marginLeft: '1rem', color: 'var(--text-secondary)' }}>
              Trang {currentPage} / {totalPages}
            </span>
          </>
        )}
      </div>
    );
  };

  return (
    <div className={`${styles.homePage} ${words.length > 0 || submittedQuery || selectedLetter ? styles.homePageActive : ''}`}>
      <section className={`${styles.hero} ${words.length > 0 || submittedQuery || selectedLetter ? styles.heroActive : ''}`}>
        <div className="container" style={{ width: '100%', maxWidth: '1200px', padding: '0 2rem' }}>
          <h1 className={`${styles.heroTitle} animate-fade-in`}>
            {heroTitle}
          </h1>
          <p className={`${styles.heroSubtitle} animate-fade-in`}>
            {heroSubtitle}
          </p>

          <div className={`${styles.searchContainer} animate-fade-in`}>
            <div className={styles.searchBox} style={{ position: 'relative' }}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                className={styles.searchInput}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className={styles.suggestionsDropdown}>
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className={`${styles.suggestionItem} ${index === selectedSuggestionIndex ? styles.suggestionSelected : ''}`}
                      onClick={() => handleSuggestionClick(suggestion)}
                      onMouseEnter={() => setSelectedSuggestionIndex(index)}
                    >
                      <span className={styles.suggestionIcon}>🔍</span>
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="animate-fade-in" style={{ marginTop: '2rem' }}>
            <AlphabetFilter selectedLetter={selectedLetter} onSelectLetter={handleLetterSelect} />
          </div>
        </div>
      </section>



      {
        (words.length > 0 || submittedQuery || selectedLetter) && (
          <section ref={resultsRef} className={styles.resultsSection}>
            <div className="container">
              {isLoading ? (
                <div className={styles.loadingContainer}>
                  <div className="loading"></div>
                  <p>Đang tìm kiếm...</p>
                </div>
              ) : words.length > 0 ? (
                <>
                  {submittedQuery && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h2 className={styles.resultsTitle}>
                        Kết quả cho "{submittedQuery}" ({words.length})
                      </h2>
                      <PaginationControls compact={true} />
                    </div>
                  )}
                  {selectedLetter && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h2 className={styles.resultsTitle}>
                        Từ bắt đầu bằng "{selectedLetter}" ({words.length})
                      </h2>
                      <PaginationControls compact={true} />
                    </div>
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
                    {(() => {
                      const totalPages = Math.ceil(words.length / CARDS_PER_PAGE);
                      const startIndex = (currentPage - 1) * CARDS_PER_PAGE;
                      const endIndex = startIndex + CARDS_PER_PAGE;
                      const currentWords = words.slice(startIndex, endIndex);

                      return currentWords.map((word) => (
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
                      ));
                    })()}
                  </div>

                  {/* Pagination Controls - Bottom */}
                  <PaginationControls />
                </>
              ) : submittedQuery ? (
                <div className={styles.emptyState}>
                  <span className={styles.emptyIcon}>📚</span>
                  <h3>Không tìm thấy từ nào</h3>
                  <p>Thử tìm kiếm với từ khóa khác hoặc thêm từ mới vào từ điển</p>
                </div>
              ) : (
                <div className={styles.emptyState}>
                  {/* Blank empty state as requested */}
                </div>
              )}
            </div>
          </section>
        )
      }

      {/* Merge Action Bar */}
      {
        isSelectionMode && selectedWordIds.length > 0 && (
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
        )
      }

      <Footer isHidden={words.length > 0 || !!submittedQuery || !!selectedLetter} />
    </div >
  );
}
