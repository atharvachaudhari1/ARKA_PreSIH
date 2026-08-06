const fs = require('fs');

let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Add @@schema("public") to the end of every model block
content = content.replace(/(model [^{]+\{[\s\S]*?)(\s*\})/g, (match, p1, p2) => {
  if (p1.includes('@@schema')) return match;
  return p1 + '\n  @@schema("public")' + p2;
});

// Add @@schema("public") to the end of every enum block
content = content.replace(/(enum [^{]+\{[\s\S]*?)(\s*\})/g, (match, p1, p2) => {
  if (p1.includes('@@schema')) return match;
  return p1 + '\n  @@schema("public")' + p2;
});

fs.writeFileSync('prisma/schema.prisma', content);
console.log('Added @@schema to all models and enums');
