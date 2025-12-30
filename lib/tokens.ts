import crypto from 'crypto';

export function generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

export function generateExpiry(minutes: number = 60): Date {
    return new Date(Date.now() + minutes * 60 * 1000);
}

export function isTokenExpired(expiry: Date | string | null): boolean {
    if (!expiry) return true;
    const expiryDate = new Date(expiry);
    return new Date() > expiryDate;
}
