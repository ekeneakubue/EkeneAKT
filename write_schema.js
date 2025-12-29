const fs = require('fs');
const schema = `datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

generator client {
  provider = "prisma-client-js"
}

model Dummy {
  id Int @id @default(autoincrement())
}
`;
fs.writeFileSync('prisma/schema.prisma', schema, 'utf8');
console.log('Schema written successfully');
