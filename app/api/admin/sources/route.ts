import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { updateSourceName, getUserByEmail } from '@/lib/db';

export async function PUT(request: NextRequest) {
    try {
        const session = await auth();
        const userEmail = session?.user?.email;

        if (!userEmail) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await getUserByEmail(userEmail);
        if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
            return NextResponse.json({ error: 'Forbidden: Only admins and moderators can update sources' }, { status: 403 });
        }

        const { oldName, newName } = await request.json();

        if (!oldName || !newName) {
            return NextResponse.json({ error: 'Both oldName and newName are required' }, { status: 400 });
        }

        if (oldName.trim() === newName.trim()) {
            return NextResponse.json({ error: 'New name must be different from old name' }, { status: 400 });
        }

        const rowsAffected = await updateSourceName(oldName, newName);

        return NextResponse.json({
            success: true,
            message: `Đã cập nhật ${rowsAffected} định nghĩa từ "${oldName}" thành "${newName}"`,
            rowsAffected
        });

    } catch (error) {
        console.error('Error updating source:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
