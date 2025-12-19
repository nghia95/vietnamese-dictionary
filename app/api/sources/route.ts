export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getDistinctSources } from '@/lib/db';

export async function GET() {
    try {
        const sources = await getDistinctSources();
        return NextResponse.json({ sources });
    } catch (error) {
        console.error('Error fetching sources:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
