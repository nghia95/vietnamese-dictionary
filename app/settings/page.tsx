'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './settings.module.css';

export default function SettingsPage() {
    const { data: session, status, update } = useSession();
    const router = useRouter();

    // Profile state
    const [displayName, setDisplayName] = useState('');
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Password state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
        if (session?.user?.name) {
            setDisplayName(session.user.name);
        }
    }, [status, session, router]);

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileSaving(true);
        setProfileMessage(null);

        try {
            const res = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: displayName }),
            });

            const data = await res.json();

            if (res.ok) {
                setProfileMessage({ type: 'success', text: 'Đã cập nhật thông tin thành công!' });
                // Update session
                await update({ name: displayName });
            } else {
                setProfileMessage({ type: 'error', text: data.error || 'Có lỗi xảy ra' });
            }
        } catch {
            setProfileMessage({ type: 'error', text: 'Có lỗi xảy ra khi cập nhật' });
        } finally {
            setProfileSaving(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage(null);

        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'Mật khẩu mới không khớp' });
            return;
        }

        if (newPassword.length < 6) {
            setPasswordMessage({ type: 'error', text: 'Mật khẩu phải có ít nhất 6 ký tự' });
            return;
        }

        setPasswordSaving(true);

        try {
            const res = await fetch('/api/user/password', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setPasswordMessage({ type: 'success', text: 'Đã đổi mật khẩu thành công!' });
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setPasswordMessage({ type: 'error', text: data.error || 'Có lỗi xảy ra' });
            }
        } catch {
            setPasswordMessage({ type: 'error', text: 'Có lỗi xảy ra khi đổi mật khẩu' });
        } finally {
            setPasswordSaving(false);
        }
    };

    if (status === 'loading') {
        return (
            <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>
                <div className="loading"></div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <div className={styles.settingsPage}>
            <div className="container" style={{ maxWidth: '800px' }}>
                <div className={styles.pageHeader}>
                    <h1 className={styles.pageTitle}>
                        <span>⚙️</span> Cài đặt
                    </h1>
                    <p className={styles.pageSubtitle}>
                        Quản lý thông tin cá nhân và bảo mật tài khoản
                    </p>
                </div>

                <div className={styles.settingsGrid}>
                    {/* Profile Section */}
                    <div className={styles.settingsCard}>
                        <div className={styles.cardHeader}>
                            <span className={styles.cardIcon}>👤</span>
                            <h2 className={styles.cardTitle}>Thông tin cá nhân</h2>
                        </div>
                        <div className={styles.cardBody}>
                            <div className={styles.profileSection}>
                                <div className={styles.avatarWrapper}>
                                    <div className={styles.avatar}>
                                        {session.user?.name?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                </div>
                                <div className={styles.profileInfo}>
                                    <p>Thay đổi thông tin hiển thị của bạn dưới đây.</p>
                                </div>
                            </div>

                            <form onSubmit={handleProfileSubmit}>
                                {profileMessage && (
                                    <div className={`${styles.alert} ${profileMessage.type === 'success' ? styles.alertSuccess : styles.alertError
                                        }`}>
                                        {profileMessage.text}
                                    </div>
                                )}

                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Email</label>
                                    <input
                                        type="email"
                                        className={styles.formInput}
                                        value={session.user?.email || ''}
                                        disabled
                                    />
                                    <p className={styles.formHint}>Email không thể thay đổi</p>
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Tên hiển thị</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="Nhập tên hiển thị"
                                        required
                                    />
                                </div>

                                <div className={styles.cardActions}>
                                    <button
                                        type="submit"
                                        className={styles.btnSave}
                                        disabled={profileSaving || displayName === session.user?.name}
                                    >
                                        {profileSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Password Section */}
                    <div className={styles.settingsCard}>
                        <div className={styles.cardHeader}>
                            <span className={styles.cardIcon}>🔒</span>
                            <h2 className={styles.cardTitle}>Đổi mật khẩu</h2>
                        </div>
                        <div className={styles.cardBody}>
                            <form onSubmit={handlePasswordSubmit}>
                                {passwordMessage && (
                                    <div className={`${styles.alert} ${passwordMessage.type === 'success' ? styles.alertSuccess : styles.alertError
                                        }`}>
                                        {passwordMessage.text}
                                    </div>
                                )}

                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Mật khẩu hiện tại</label>
                                    <input
                                        type="password"
                                        className={styles.formInput}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="Nhập mật khẩu hiện tại"
                                        required
                                    />
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Mật khẩu mới</label>
                                        <input
                                            type="password"
                                            className={styles.formInput}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Nhập mật khẩu mới"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Xác nhận mật khẩu</label>
                                        <input
                                            type="password"
                                            className={styles.formInput}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Nhập lại mật khẩu mới"
                                            required
                                        />
                                    </div>
                                </div>

                                <p className={styles.formHint}>Mật khẩu phải có ít nhất 6 ký tự</p>

                                <div className={styles.cardActions}>
                                    <button
                                        type="button"
                                        className={styles.btnCancel}
                                        onClick={() => {
                                            setCurrentPassword('');
                                            setNewPassword('');
                                            setConfirmPassword('');
                                            setPasswordMessage(null);
                                        }}
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        className={styles.btnSave}
                                        disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
                                    >
                                        {passwordSaving ? 'Đang lưu...' : 'Đổi mật khẩu'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
