
import { NextResponse } from 'next/server';
import { getGlobalStats } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const stats = await getGlobalStats();
        return NextResponse.json({ stats });
    } catch (error) {
        console.error('Stats error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
