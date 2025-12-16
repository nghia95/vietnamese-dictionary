import { createUser } from '../lib/db';
import bcrypt from 'bcryptjs';

async function seed() {
    console.log('🌱 Seeding test user...');
    const email = 'test@example.com';
    const password = 'password123';
    const name = 'Test User';

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        createUser(email, hashedPassword, name);
        console.log(`✅ User ${email} created successfully.`);
    } catch (error) {
        console.error('Error creating user:', error);
    }
}

seed();
