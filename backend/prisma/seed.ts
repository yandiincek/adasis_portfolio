import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed User Default
  const user = await prisma.user.upsert({
    where: { username: 'dandy.anugrah' },
    update: {},
    create: {
      username: 'dandy.anugrah',
      password_hash: '$2b$10$placeholder_hash_for_seed_user',
      full_name: 'Dandy Anugrah D',
      nrp: '80004635',
      department: 'PPM',
      role: 'USER',
      contact: '0822-1150-8866'
    }
  });

  console.log('✅ User seed berhasil:', user.full_name, `(ID: ${user.id})`);

  // Seed Approver (SH User)
  const approverUH = await prisma.user.upsert({
    where: { username: 'anas.baharudin' },
    update: {},
    create: {
      username: 'anas.baharudin',
      password_hash: '$2b$10$placeholder_hash_for_seed_approver',
      full_name: 'Anas Baharudin. E',
      nrp: '80001234',
      department: 'GA',
      role: 'UH_CGA',
      contact: '0812-0000-0001'
    }
  });

  console.log('✅ Approver UH seed berhasil:', approverUH.full_name, `(ID: ${approverUH.id})`);

  // Seed Approver (SH CGA)
  const approverSH = await prisma.user.upsert({
    where: { username: 'gazali.rahman' },
    update: {},
    create: {
      username: 'gazali.rahman',
      password_hash: '$2b$10$placeholder_hash_for_seed_approver',
      full_name: 'M. Gazali Rahman',
      nrp: '80005678',
      department: 'CGA',
      role: 'SH_CGA',
      contact: '0812-0000-0002'
    }
  });

  console.log('✅ Approver SH seed berhasil:', approverSH.full_name, `(ID: ${approverSH.id})`);
}

main()
  .catch((e) => {
    console.error('❌ Seed gagal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
