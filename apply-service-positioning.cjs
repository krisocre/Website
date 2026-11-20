// Service metadata shared by the generator and the production URL build.
const metadata={
 'index.html':{title:'Google Review Removal Service Canada | ReviewRemoval.ca',description:'Professional Google review removal assistance for Canadian businesses. Help reporting fake, spam and policy-violating reviews. Get a free assessment.'},
 'about.html':{title:'About ReviewRemoval | Google Review Removal Canada',description:'How ReviewRemoval helps Canadian businesses assess and report Google reviews. Find clear CAD fees, evidence guidance and an initial assessment.'},
 'review-removal-canada.html':{title:'Google Review Removal Across Canada | Service Areas',description:'Google review removal assistance across Canada. Remote support for Toronto, Mississauga, Vancouver and other communities, with clear CAD fees.'},
 'google-review-removal-cost-canada.html':{title:'Google Review Removal Cost Canada | ReviewRemoval',description:'Google review removal costs in Canada: CAD $50 upfront per review + $125 if removed. Compare free reporting, paid assistance and partial-success examples.'},
 'remove-fake-google-reviews.html':{title:'Remove Fake Google Reviews in Canada | ReviewRemoval',description:'How Canadian businesses can report fake Google reviews, document policy concerns and request professional help. Evidence guidance, without a removal guarantee.'}
};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function metadataFor(file){ return metadata[file]; }


function applyPositioning(file,html){
 const m=metadataFor(file);
 if(!m)return html;
 const end=html.indexOf('</head>');
 if(end<0)throw Error('Missing head: '+file);
 let head=html.slice(0,end);
 head=head.replace(/<title>[^<]*<\/title>/,()=>'<title>'+esc(m.title)+'</title>');
 for(const key of ['description','og:title','og:description','twitter:title','twitter:description']){
  const value=key.endsWith('title')?m.title:m.description;
  head=head.replace(new RegExp('(<meta (?:name|property)="'+key+'" content=")[^"]*','g'),(_,prefix)=>prefix+esc(value));
 }
 const canonical=head.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
 head=head.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,(tag,text)=>{
  const data=JSON.parse(text), old=JSON.stringify(data);
  function visit(node){
   if(!node||typeof node!=='object')return;
   if(node['@type']==='Organization'&&node.name==='ReviewRemoval')node.description='Google review removal assistance for businesses across Canada.';
   if(['WebPage','AboutPage','CollectionPage','Article'].includes(node['@type'])){
    node.name=m.title;node.description=m.description;
    if(node.headline)node.headline=m.title.replace(/ \| ReviewRemoval(?:\.ca)?$/,'');
   }
   if(node['@type']==='ListItem'&&node.item===canonical)node.name=m.title.replace(/ \| ReviewRemoval(?:\.ca)?$/,'');
   if(file==='index.html'&&node['@type']==='Service')node.description='Professional assistance assessing, preparing and managing reports about Google reviews that may violate policy, for businesses across Canada.';
   if(file==='review-removal-canada.html'&&node['@type']==='Service'){
    node.name='Google review removal service across Canada';node.serviceType='Google review removal assistance';node.description=m.description;
   }
   for(const value of Object.values(node))if(value&&typeof value==='object')visit(value);
  }
  visit(data);
  return old===JSON.stringify(data)?tag:'<script type="application/ld+json">'+JSON.stringify(data).replaceAll('<','\\u003c')+'</script>';
 });
 return head+html.slice(end);
}
module.exports={applyPositioning,metadataFor};
if(require.main===module){
 const fs=require('node:fs');
 const path=require('node:path');
 for(const file of Object.keys(metadata)){
  const location=path.join(__dirname,file),before=fs.readFileSync(location,'utf8');
  const after=applyPositioning(file,before);
  if(after!==before)fs.writeFileSync(location,after,'utf8');
 }
}
