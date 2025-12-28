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

        const { avatar } = await request.json();

        if (!avatar) {
            return NextResponse.json(
                { error: 'Avatar data is required' },
                { status: 400 }
            );
        }

        // Validate that it's a valid base64 data URL
        if (!avatar.startsWith('data:image/')) {
            return NextResponse.json(
                { error: 'Invalid image format' },
                { status: 400 }
            );
        }

        // Check size (limit to ~500KB base64 which is ~375KB image)
        if (avatar.length > 700000) {
            return NextResponse.json(
                { error: 'Image too large. Please use an image under 500KB.' },
                { status: 400 }
            );
        }

        await client.execute({
            sql: 'UPDATE users SET avatar = ? WHERE id = ?',
            args: [avatar, parseInt(session.user.id)]
        });

        return NextResponse.json({
            success: true,
            message: 'Avatar updated successfully',
            avatar
        });
    } catch (error) {
        console.error('Error updating avatar:', error);
        return NextResponse.json(
            { error: 'Failed to update avatar' },
            { status: 500 }
        );
    }
}

export async function DELETE() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await client.execute({
            sql: 'UPDATE users SET avatar = NULL WHERE id = ?',
            args: [parseInt(session.user.id)]
        });

        return NextResponse.json({
            success: true,
            message: 'Avatar removed successfully'
        });
    } catch (error) {
        console.error('Error removing avatar:', error);
        return NextResponse.json(
            { error: 'Failed to remove avatar' },
            { status: 500 }
        );
    }
}
