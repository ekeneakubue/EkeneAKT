const fs = require('fs');
const content = fs.readFileSync('prisma/schema.prisma', 'utf8');
console.log('--- Content Start ---');
console.log(content);
console.log('--- Content End ---');
console.log('Length:', content.length);
console.log('First 100 chars (hex):', Buffer.from(content.substring(0, 100)).toString('hex'));
