const fs = require('fs');
const files = [
  'src/app/page.tsx',
  'src/app/(app)/dashboard/page.tsx',
  'src/app/(app)/notifications/page.tsx',
  'src/app/(app)/requests/page.tsx',
  'src/app/(app)/teams/page.tsx',
  'src/app/(app)/teams/create/page.tsx',
  'src/app/(app)/teams/[id]/page.tsx',
  'src/app/(app)/teams/[id]/chat/page.tsx'
];

// We want to target the specific inline-block black tags that look like terminal prompts
const regex1 = /display:\s*"inline-block",\s*background:\s*"#1a1a1a",\s*color:\s*"(?:#ffffff|#fffce8)",\s*padding:\s*"[^"]+",\s*fontSize:\s*"[^"]+",\s*fontFamily:\s*"var\(--font-mono\)",\s*fontWeight:\s*800,\s*borderRadius:\s*"3px",\s*marginBottom:\s*"[^"]+",\s*letterSpacing:\s*"1px",\s*boxShadow:\s*"2px 2px 0px #[0-9a-fA-F]{6}"/g;

// Also target some variations that might not have inline-block but are headers
const regex2 = /background:\s*"#1a1a1a",\s*color:\s*"#ffffff",\s*padding:\s*"0\.65rem 1\.25rem",/g;

const replacement1 = `display: "inline-block",
            background: "#1a1a1a",
            color: "#ffffff",
            padding: "0.35rem 0.85rem",
            fontSize: "0.8rem",
            fontFamily: "var(--font-mono)",
            fontWeight: 800,
            borderRadius: "3px",
            marginBottom: "0.75rem",
            letterSpacing: "1px",
            boxShadow: "2px 2px 0px #5b5fc7"`;

files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    const oldContent = content;
    
    content = content.replace(regex1, replacement1);
    
    // Unify the terminal header bars inside dashboard too
    if (f.includes('dashboard')) {
        content = content.replace(/padding:\s*"0\.65rem 1\.25rem",\s*fontSize:\s*"0\.75rem",/g, `padding: "0.65rem 1.25rem",\n            fontSize: "0.8rem",`);
    }

    if (content !== oldContent) {
      fs.writeFileSync(f, content);
      console.log('Updated ' + f);
    }
  }
});
