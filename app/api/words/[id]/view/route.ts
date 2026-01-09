
import { NextResponse } from 'next/server';
import { incrementWordView } from '@/lib/db';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> } // params is now a Promise in Next.js 15+? Or strictly typed. 
    // Wait, in Next.js 13+ app directory, params is dynamic. 
    // Standard signature: (req: Request, { params }: { params: { id: string } })
    // Safe to rely on standard typing. The user environment is likely Next 14 or latest.
) {
    try {
        // Need to await params in newer Next.js versions if it's treating it as promise, but standard object destructuring usually works.
        // Let's use the explicit type that Next.js expects or generic.
        // Actually, for API routes, `context` argument has `params`.
        const { id } = await params;
        const wordId = parseInt(id);

        if (isNaN(wordId)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        await incrementWordView(wordId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('View increment error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
