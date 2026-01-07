'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './Footer.module.css';

interface ContactItem {
    id: string;
    text: string;
    link: string;
    icon: string;
}

interface ContactInfo {
    email?: string;
    facebook?: string;
    youtube?: string;
    phone?: string;
    address?: string;
    emailIcon?: string;
    phoneIcon?: string;
    addressIcon?: string;
    facebookIcon?: string;
    youtubeIcon?: string;
}

export default function Footer({ isHidden }: { isHidden?: boolean }) {
    const [contactInfo, setContactInfo] = useState<ContactInfo>({});
    const [contacts, setContacts] = useState<ContactItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                const settings = data.settings || {};
                setContactInfo({
                    email: settings.contact_email,
                    facebook: settings.contact_facebook,
                    youtube: settings.contact_youtube,
                    phone: settings.contact_phone,
                    address: settings.contact_address,
                    emailIcon: settings.contact_email_icon,
                    phoneIcon: settings.contact_phone_icon,
                    addressIcon: settings.contact_address_icon,
                    facebookIcon: settings.contact_facebook_icon,
                    youtubeIcon: settings.contact_youtube_icon,
                });

                try {
                    const list = JSON.parse(settings.contact_list || '[]');
                    if (Array.isArray(list)) {
                        setContacts(list);
                    }
                } catch (e) {
                    console.error('Failed to parse contact list', e);
                }
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, []);

    if (isLoading) return null;
    if (isHidden) return null;

    // Only render if at least one contact info is present or dynamic contacts exist
    const hasInfo = Object.values(contactInfo).some(val => val) || contacts.length > 0;
    if (!hasInfo) return null;

    return (
        <footer className={styles.footer}>
            <div className="container">
                <div className={styles.footerContent}>
                    <div className={styles.footerSection}>
                        <h3 className={styles.footerTitle}>Liên hệ</h3>
                        <div className={styles.contactLinks}>
                            {contactInfo.address && (
                                <div className={styles.contactItem}>
                                    {contactInfo.addressIcon ? (
                                        <img src={contactInfo.addressIcon} alt="" className={styles.icon} style={{ borderRadius: '0', objectFit: 'contain' }} />
                                    ) : (
                                        <span className={styles.icon}>📍</span>
                                    )}
                                    <span>{contactInfo.address}</span>
                                </div>
                            )}
                            {contactInfo.phone && (
                                <div className={styles.contactItem}>
                                    {contactInfo.phoneIcon ? (
                                        <img src={contactInfo.phoneIcon} alt="" className={styles.icon} style={{ borderRadius: '0', objectFit: 'contain' }} />
                                    ) : (
                                        <span className={styles.icon}>📞</span>
                                    )}
                                    <a href={`tel:${contactInfo.phone}`}>{contactInfo.phone}</a>
                                </div>
                            )}
                            {contactInfo.email && (
                                <div className={styles.contactItem}>
                                    {contactInfo.emailIcon ? (
                                        <img src={contactInfo.emailIcon} alt="" className={styles.icon} style={{ borderRadius: '0', objectFit: 'contain' }} />
                                    ) : (
                                        <span className={styles.icon}>📧</span>
                                    )}
                                    <a href={`mailto:${contactInfo.email}`}>{contactInfo.email}</a>
                                </div>
                            )}

                            {/* Dynamic Contacts */}
                            {contacts.map((item) => (
                                <div key={item.id} className={styles.contactItem}>
                                    {item.icon ? (
                                        <img src={item.icon} alt="" className={styles.icon} style={{ borderRadius: '0', objectFit: 'contain' }} />
                                    ) : (
                                        <span className={styles.icon}>🔹</span>
                                    )}
                                    {item.link ? (
                                        <a href={item.link} target="_blank" rel="noopener noreferrer">{item.text}</a>
                                    ) : (
                                        <span>{item.text}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={styles.footerSection}>
                        <h3 className={styles.footerTitle}>Theo dõi chúng tôi</h3>
                        <div className={styles.socialLinks}>
                            {contactInfo.facebook && (
                                <a href={contactInfo.facebook} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                                    {contactInfo.facebookIcon ? (
                                        <img src={contactInfo.facebookIcon} alt="Facebook" className={styles.icon} style={{ borderRadius: '0', objectFit: 'contain', width: '20px', height: '20px' }} />
                                    ) : (
                                        <span className={styles.icon}>Facebook</span>
                                    )}
                                </a>
                            )}
                            {contactInfo.youtube && (
                                <a href={contactInfo.youtube} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                                    {contactInfo.youtubeIcon ? (
                                        <img src={contactInfo.youtubeIcon} alt="YouTube" className={styles.icon} style={{ borderRadius: '0', objectFit: 'contain', width: '20px', height: '20px' }} />
                                    ) : (
                                        <span className={styles.icon}>YouTube</span>
                                    )}
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                <div className={styles.copyright}>
                    <p>&copy; {new Date().getFullYear()} Từ điển tiếng Việt. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
