import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {runAgent} from './agent.mjs';

// Parameter area: host, port, request limits and static files are defined here.
const CONFIG={host:'127.0.0.1',port:4173,maxBodyBytes:300000,maxConcurrent:2};
const PATHS={publicRoot:new URL('./docs/',import.meta.url),routes:{'/':'index.html','/index.html':'index.html','/style.css':'style.css','/app.js':'app.js','/engine.mjs':'engine.mjs'},health:'/api/health',agent:'/api/agent'};
const TYPES={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8'};
let active=0;
const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data))};

const server=http.createServer(async(req,res)=>{
  const validHosts=[`${CONFIG.host}:${CONFIG.port}`,`localhost:${CONFIG.port}`];
  if(!validHosts.includes(req.headers.host)){json(res,403,{error:'Unsupported host'});return}
  const url=new URL(req.url,`http://${req.headers.host}`);
  if(req.method==='GET'&&url.pathname===PATHS.health){json(res,200,{agent:true,mode:'local',storesCredentials:false});return}
  if(req.method==='POST'&&url.pathname===PATHS.agent){
    if(req.headers.origin!==`http://${req.headers.host}`){json(res,403,{error:'Only same-origin browser requests are accepted'});return}
    if(!req.headers['content-type']?.startsWith('application/json')){json(res,415,{error:'Only JSON requests are accepted'});return}
    if(active>=CONFIG.maxConcurrent){json(res,429,{error:'Another analysis is already running. Please retry shortly.'});return}
    active++;
    try{
      const chunks=[];let bytes=0;
      for await(const chunk of req){bytes+=chunk.length;if(bytes>CONFIG.maxBodyBytes){json(res,413,{error:'Request body is too large'});return}chunks.push(chunk)}
      let input;try{input=JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{json(res,400,{error:'Malformed JSON request'});return}
      json(res,200,await runAgent(input));
    }catch(error){json(res,422,{error:error.name==='TimeoutError'?'Model request timed out. Please retry.':error.message})}finally{active--}
    return;
  }
  if(req.method!=='GET'){json(res,405,{error:'Method not allowed'});return}
  const file=PATHS.routes[url.pathname];
  if(!file){json(res,404,{error:'Page not found'});return}
  try{
    const content=await readFile(new URL(file,PATHS.publicRoot));
    const ext=file.slice(file.lastIndexOf('.'));
    res.writeHead(200,{'Content-Type':TYPES[ext],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end(content);
  }catch{json(res,500,{error:'Static file is unavailable'})}
});

server.requestTimeout=160000;
server.listen(CONFIG.port,CONFIG.host,()=>console.log(`Echo local app: http://${CONFIG.host}:${CONFIG.port}`));
server.on('error',error=>{console.error(error.code==='EADDRINUSE'?'Port 4173 is already in use. Stop the existing process or change CONFIG.port.':'The local server could not start.');process.exitCode=1});
