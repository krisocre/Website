const fs=require('node:fs'),path=require('node:path');
const root=__dirname;
const legacy=/\s*<!-- Google tag \(gtag\.js\) -->[\s\S]*?<!-- \/Google tag \(gtag\.js\) -->/g;
const marker=/\s*<!-- measurement bootstrap start -->[\s\S]*?<!-- measurement bootstrap end -->/g;
function applyToHtml(html,file){
 const prefix=file==='404.html'?'/':file.startsWith('blog/')?'../':'';
 const block=`\n  <!-- measurement bootstrap start -->\n  <link rel="stylesheet" href="${prefix}measurement.css">\n  <script src="${prefix}measurement-config.js" defer></script>\n  <script src="${prefix}measurement.js" defer></script>\n  <!-- measurement bootstrap end -->`;
 return html.replace(legacy,'').replace(marker,'').replace('</head>',block+'\n</head>');
}
function install(){
 const files=[...fs.readdirSync(root).filter(f=>f.endsWith('.html')),...fs.readdirSync(path.join(root,'blog')).filter(f=>f.endsWith('.html')).map(f=>'blog/'+f)];
 for(const file of files){const p=path.join(root,file),before=fs.readFileSync(p,'utf8'),after=applyToHtml(before,file);if(before!==after)fs.writeFileSync(p,after,'utf8');}
 console.log(`Installed one consent-controlled measurement bootstrap on ${files.length} pages.`);
}
module.exports={applyToHtml,install};
if(require.main===module)install();
