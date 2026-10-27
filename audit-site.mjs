// Read-only audit of this repository's own domain. No form POSTs or account actions.
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const host=fs.readFileSync(path.join(root,'CNAME'),'utf8').trim();
if(!['reviewremoval.ca','reviewsboost.ca'].includes(host))throw Error('Unexpected site host');
const origin='https://'+host;
const sitemap=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
const decode=s=>s.replaceAll('&amp;','&');
const canonicalRef=(reference,base)=>{
 const url=new URL(decode(reference),base);url.hash='';
 if(url.origin===origin&&url.pathname==='/index.html')url.pathname='/';
 return url.href;
};
const pages=urls.map(url=>{
 if(!url.startsWith(origin+'/'))throw Error('Sitemap points outside this site');
 const file=new URL(url).pathname==='/'?'index.html':new URL(url).pathname.slice(1);
 const html=fs.readFileSync(path.join(root,file),'utf8');
 const title=html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
 const main=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]||'';
 const links=[...html.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(m=>{try{return canonicalRef(m[1],url)}catch{return ''}});
 const bodyLinks=[...main.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(m=>{try{return canonicalRef(m[1],url)}catch{return ''}});
 const other=host==='reviewremoval.ca'?'reviewsboost.ca':'reviewremoval.ca';
 return {url,file,title,bytes:Buffer.byteLength(html),links:[...new Set(links)],bodyLinks:[...new Set(bodyLinks)],
   h1:(html.match(/<h1\b/g)||[]).length,hasLegalNotice:html.includes('id="submission-legal"'),
   foreignBrandHost:html.includes(other),incoming:0,contextualIncoming:0};
});
for(const page of pages){
 page.incoming=pages.filter(p=>p.url!==page.url&&p.links.includes(page.url)).length;
 page.contextualIncoming=pages.filter(p=>p.url!==page.url&&p.bodyLinks.includes(page.url)).length;
}
const targets=new Set([...urls,origin+'/robots.txt',origin+'/sitemap.xml',origin+'/feed.xml',origin+'/index.html',origin+'/seo-audit-missing-page-2026',origin+'/nested/seo-audit-missing-page-2026']);
const notes=host==='reviewremoval.ca'?'SEO-GAP-AUDIT':'SEO-IMPLEMENTATION';
targets.add(origin+'/'+notes+'.md');targets.add(origin+'/'+notes+'.html');
const live=[];
if(process.argv.includes('--live')){
 const queue=[...targets];
 await Promise.all(Array.from({length:4},async()=>{
  while(queue.length){
   const url=queue.shift();
   try{
    const start=performance.now();
    const response=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(15000),headers:{'User-Agent':'SiteQualityAudit/1.0','Accept':'text/html,application/xml,text/plain;q=0.9,*/*;q=0.5'}});
    const body=await response.text();
    live.push({url,status:response.status,location:response.headers.get('location'),contentType:response.headers.get('content-type'),robots:response.headers.get('x-robots-tag'),ms:Math.round(performance.now()-start),
     title:body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1],canonical:body.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/i)?.[1],hasLegalNotice:body.includes('id="submission-legal"'),bytes:Buffer.byteLength(body)});
   }catch(error){live.push({url,error:error.message})}
  }
 }));
}
const report={host,checkedAt:new Date().toISOString(),pages,live};
const out=process.argv.find(a=>a.startsWith('--report='))?.slice(9);
if(out){fs.mkdirSync(path.dirname(path.resolve(root,out)),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n')}
console.log(JSON.stringify({host,pages:pages.length,weakContextualLinks:pages.filter(p=>p.contextualIncoming<2).map(p=>({file:p.file,incoming:p.incoming,contextual:p.contextualIncoming})),foreignBrandHosts:pages.filter(p=>p.foreignBrandHost).map(p=>p.file),liveChecks:live.length,liveUnexpected:live.filter(p=>p.error||p.status!==200||p.url.includes(notes)).map(({url,status,error,contentType,location})=>({url,status,error,contentType,location}))},null,2));
