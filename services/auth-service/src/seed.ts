import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { connectToDatabase, sequelize } from '@/db/sequelize';
import { UserCredentials } from '@/models';
import { hashPassword } from '@/utils/token';

const seedUsers = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'admin@gmail.com',
    displayName: 'Admin',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    email: 'test1@gmail.com',
    displayName: 'Công Mạnh',
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    email: 'test2@gmail.com',
    displayName: 'Trần Thị B',
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    email: 'test3@gmail.com',
    displayName: 'Lê Hải C',
  },
  {
    id: '55555555-5555-4555-8555-555555555555',
    email: 'test4@gmail.com',
    displayName: 'Phạm Văn D',
  },
  {
    id: '66666666-6666-4666-8666-666666666666',
    email: 'test5@gmail.com',
    displayName: 'Hoàng Thị E',
  },
];

async function seed() {
  try {
    console.log('Connecting to Auth Database...');
    await connectToDatabase();
    await sequelize.sync({ alter: true });

    const passwordHash = await hashPassword('Password123!');

    console.log('Seeding 5 test user credentials into auth-service (Password: Password123!)...');
    for (const userData of seedUsers) {
      const [record, created] = await UserCredentials.upsert({
        ...userData,
        passwordHash,
      });
      console.log(
        `${created ? 'Created' : 'Updated'} credentials for: ${userData.displayName} (${userData.email})`
      );
    }

    console.log('Auth service seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding auth-service:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

seed();
