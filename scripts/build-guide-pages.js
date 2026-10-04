// Build a complete page-text snapshot from the same HTML served to guests.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'guide-extay.html'),'utf8').replace(/\r\n/g,'\n');
function text(value){return value.replace(/<script\b[\s\S]*?<\/script>/gi,'').replace(/<style\b[\s\S]*?<\/style>/gi,'').replace(/<(?:span|i)\b[^>]*class="[^"]*\bmi\b[^"]*"[^>]*>[\s\S]*?<\/(?:span|i)>/gi,'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim();}
const pages=[];
for(const match of html.matchAll(/<section\b[^>]*data-screen="([^"]+)"[^>]*>/g)){
  let depth=1,end=match.index+match[0].length;
  const remainder=html.slice(end);
  for(const tag of remainder.matchAll(/<\/?section\b[^>]*>/g)){
    depth+=tag[0].startsWith('</')?-1:1;
    if(!depth){end+=tag.index;break;}
  }
  const body=html.slice(match.index+match[0].length,end);
  pages.push({route:match[1],text:text(body)});
}
if(pages.length!==12||pages.some(p=>!p.text))throw new Error('Missing guide pages');
const result={propertyId:'extay-mansion-haebangchon',source:'guide-extay.html',sha256:crypto.createHash('sha256').update(html).digest('hex'),pages};
const output=JSON.stringify(result,null,2)+'\n',file=path.join(root,'data/guide-pages.json');
if(process.argv.includes('--check')){
  if(!fs.existsSync(file)||fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n')!==output){console.error('Page knowledge is stale. Run npm run build:chat.');process.exitCode=1;}
}else{fs.writeFileSync(file,output);console.log(`Built complete knowledge for ${pages.length} EXTAY pages.`);}
