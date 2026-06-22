const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Connecting...');
  const res = await prisma.$queryRaw`SELECT TOP 1 * FROM KuponTambahanBBM`;
  console.log('Result:', res);
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
