import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { client } from '@/lib/db';

export async function PATCH(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { name } = await request.json();

        if (!name || name.trim().length === 0) {
            return NextResponse.json(
                { error: 'Tên hiển thị không được để trống' },
                { status: 400 }
            );
        }

        if (name.length > 100) {
            return NextResponse.json(
                { error: 'Tên hiển thị không được quá 100 ký tự' },
                { status: 400 }
            );
        }

        await client.execute({
            sql: 'UPDATE users SET name = ? WHERE id = ?',
            args: [name.trim(), parseInt(session.user.id)]
        });

        return NextResponse.json({
            success: true,
            message: 'Đã cập nhật thông tin thành công'
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json(
            { error: 'Có lỗi xảy ra khi cập nhật thông tin' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const result = await client.execute({
            sql: 'SELECT id, email, name, role, created_at FROM users WHERE id = ?',
            args: [parseInt(session.user.id)]
        });

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ user: result.rows[0] });
    } catch (error) {
        console.error('Error fetching profile:', error);
        return NextResponse.json(
            { error: 'Có lỗi xảy ra' },
            { status: 500 }
        );
    }
}
