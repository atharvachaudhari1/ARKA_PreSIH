const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');
content = content.replace(/\s*@@schema\("public"\)/g, '');
fs.writeFileSync('prisma/schema.prisma', content);
console.log('Removed @@schema');
