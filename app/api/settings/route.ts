export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getSetting, updateSetting, getAllSettings, getUserByEmail } from '@/lib/db';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
    try {
        const settings = await getAllSettings();
        return NextResponse.json({ settings });
    } catch (error) {
        console.error('Get settings error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        // Check if admin
        const userEmail = session?.user?.email;
        if (!userEmail) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await getUserByEmail(userEmail);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { settings } = body;

        if (!settings || typeof settings !== 'object') {
            return NextResponse.json({ error: 'Invalid settings data' }, { status: 400 });
        }

        for (const [key, value] of Object.entries(settings)) {
            // Only allow string values for now
            if (typeof value === 'string') {
                await updateSetting(key, value, user.id);
            }
        }

        return NextResponse.json({ message: 'Settings updated successfully' });

    } catch (error) {
        console.error('Update settings error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
