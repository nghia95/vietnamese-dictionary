export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/db';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || !session.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const users = getAllUsers();
        return NextResponse.json({ users });
    } catch (error) {
        console.error('Get users error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
