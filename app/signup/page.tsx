'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './auth.module.css';

export default function SignupPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Đã xảy ra lỗi');
            } else {
                router.push('/login?success=true');
            }
        } catch (err) {
            setError('Đã xảy ra lỗi. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.authPage}>
            <div className={styles.authCard}>
                <h1 className={styles.authTitle}>Đăng ký</h1>
                <p className={styles.authSubtitle}>
                    Tạo tài khoản mới để bắt đầu đóng góp từ vựng.
                </p>

                {error && (
                    <div className="alert alert-error">{error}</div>
                )}

                <form onSubmit={handleSubmit} className={styles.authForm}>
                    <div className="form-group">
                        <label htmlFor="name">Tên của bạn</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="Nguyễn Văn A"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="your@email.com"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Mật khẩu (tối thiểu 6 ký tự)</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            minLength={6}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ width: '100%' }}>
                        {isLoading ? <span className="loading"></span> : 'Đăng ký'}
                    </button>
                </form>

                <p className={styles.authFooter}>
                    Đã có tài khoản?{' '}
                    <Link href="/login">Đăng nhập</Link>
                </p>
            </div>
        </div>
    );
}
