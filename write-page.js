const fs = require('fs');
const content = fs.readFileSync('page-content.tsx', 'utf8');
fs.writeFileSync('src/app/mapa-capilar/reporte/[id]/page.tsx', content, 'utf8');
console.log('Done - ' + content.split('\n').length + ' lines written');