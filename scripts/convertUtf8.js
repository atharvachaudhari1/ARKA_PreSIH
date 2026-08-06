const fs = require('fs');
const path = 'prisma/migrations/20260807000001_schema_update/migration.sql';
const content = fs.readFileSync(path, 'utf16le');
fs.writeFileSync(path, content, 'utf8');
console.log('Converted to UTF-8');
