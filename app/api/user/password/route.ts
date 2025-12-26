import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { client } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function PATCH(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { currentPassword, newPassword } = await request.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { error: 'Vui lòng nhập đầy đủ thông tin' },
                { status: 400 }
            );
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { error: 'Mật khẩu mới phải có ít nhất 6 ký tự' },
                { status: 400 }
            );
        }

        // Fetch current user's password hash
        const result = await client.execute({
            sql: 'SELECT password_hash FROM users WHERE id = ?',
            args: [parseInt(session.user.id)]
        });

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        const user = result.rows[0];
        const passwordHash = user.password_hash as string;

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, passwordHash);

        if (!isValid) {
            return NextResponse.json(
                { error: 'Mật khẩu hiện tại không đúng' },
                { status: 400 }
            );
        }

        // Hash new password
        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        // Update password
        await client.execute({
            sql: 'UPDATE users SET password_hash = ? WHERE id = ?',
            args: [newPasswordHash, parseInt(session.user.id)]
        });

        return NextResponse.json({
            success: true,
            message: 'Đã đổi mật khẩu thành công'
        });
    } catch (error) {
        console.error('Error changing password:', error);
        return NextResponse.json(
            { error: 'Có lỗi xảy ra khi đổi mật khẩu' },
            { status: 500 }
        );
    }
}
