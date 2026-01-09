
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDistinctWordTypes, updateWordTypeName } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const types = await getDistinctWordTypes();
        return NextResponse.json({ types });
    } catch (error) {
        console.error('Error fetching word types:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'moderator')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { oldName, newName } = body;

        if (!oldName || !newName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const updatedCount = await updateWordTypeName(
            oldName,
            newName,
            parseInt(session.user.id)
        );

        return NextResponse.json({
            success: true,
            message: `Updated ${updatedCount} definitions`,
            updatedCount
        });
    } catch (error) {
        console.error('Error updating word type:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

import { createWordType } from '@/lib/db';

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'moderator')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { name } = body;

        if (!name || !name.trim()) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const success = await createWordType(name.trim(), parseInt(session.user.id));

        if (!success) {
            return NextResponse.json({ error: 'Failed to create type. It might already exist.' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error creating word type:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
