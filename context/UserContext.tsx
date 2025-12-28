'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface UserProfile {
    id: number;
    email: string;
    name: string;
    role: string;
    avatar: string | null;
}

interface UserContextType {
    user: UserProfile | null;
    isLoading: boolean;
    refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
    user: null,
    isLoading: true,
    refreshUser: async () => { },
});

export function UserProvider({ children }: { children: ReactNode }) {
    const { status } = useSession();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = async () => {
        try {
            const res = await fetch('/api/user/profile');
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error('Failed to fetch user profile', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (status === 'loading') return;
        if (status === 'unauthenticated') {
            setUser(null);
            setLoading(false);
        } else {
            fetchUser();
        }
    }, [status]);

    return (
        <UserContext.Provider value={{ user, isLoading: loading, refreshUser: fetchUser }}>
            {children}
        </UserContext.Provider>
    );
}

export const useUser = () => useContext(UserContext);
