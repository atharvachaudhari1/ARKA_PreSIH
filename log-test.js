const fs = require('fs');
let code = fs.readFileSync('src/__tests__/api/join-requests.test.ts', 'utf8');
code = code.replace(/expect\(res\.status\)\.toBe\(200\);/g, 'const body = await res.clone().json().catch(()=>({})); console.log("Failed with body:", body); expect(res.status).toBe(200);');
fs.writeFileSync('src/__tests__/api/join-requests.test.ts', code);
