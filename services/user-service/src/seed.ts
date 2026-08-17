import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { sequelize, connectToDatabase } from '@/db/sequelize';
import { UserModel } from '@/db/models/user.model';
import { Role } from '@/types/user';

const seedUsers = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'admin@gmail.com',
    displayName: 'Admin',
    role: Role.ADMIN,
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    email: 'test1@gmail.com',
    displayName: 'Công Mạnh',
    role: Role.USER,
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    email: 'test2@gmail.com',
    displayName: 'Trần Thị B',
    role: Role.USER,
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    email: 'test3@gmail.com',
    displayName: 'Lê Hải C',
    role: Role.USER,
  },
  {
    id: '55555555-5555-4555-8555-555555555555',
    email: 'test4@gmail.com',
    displayName: 'Phạm Văn D',
    role: Role.USER,
  },
  {
    id: '66666666-6666-4666-8666-666666666666',
    email: 'test5@gmail.com',
    displayName: 'Hoàng Thị E',
    role: Role.USER,
  },
];

async function seed() {
  try {
    console.log('Connecting to User Database...');
    await connectToDatabase();

    await sequelize.sync({ alter: true });

    console.log('Seeding 5 test users into user-service...');
    for (const userData of seedUsers) {
      const [user, created] = await UserModel.upsert(userData);
      console.log(
        `${created ? 'Created' : 'Updated'} user: ${userData.displayName} (${userData.email}) - ID: ${user.id}`
      );
    }

    console.log('User service seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding user-service:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

seed();
