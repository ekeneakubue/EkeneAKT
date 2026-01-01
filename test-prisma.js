
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const products = await prisma.product.findMany({
            select: { id: true, displayOrder: true },
            take: 1
        });
        console.log('Successfully queried displayOrder:', products);
    } catch (error) {
        console.error('Error querying displayOrder:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
