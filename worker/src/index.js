// Aurora Engine — Worker HTTP + MCP (Streamable HTTP).
// Requer KV binding AURORA_KV e secrets OPENROUTER_API_KEY / MCP_ACCESS_TOKEN.
const cors={ "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Methods":"GET,POST,OPTIONS", "Access-Control-Allow-Headers":"Content-Type,Authorization,Mcp-Session-Id" };
const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{...cors,"Content-Type":"application/json",...headers}});
const enc=s=>new TextEncoder().encode(s);
const b64=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const uid=()=>crypto.randomUUID();
const validColor=v=>typeof v==="string"&&/^#[0-9a-f]{6}$/i.test(v);
const clamp=(v,min,max,def)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):def;
async function hash(s){return b64(await crypto.subtle.digest("SHA-256",enc(s)))}
async function auth(req,env){const h=req.headers.get("Authorization")||"";if(!h.startsWith("Bearer ")||!env.MCP_ACCESS_TOKEN)return false;return h.slice(7)===env.MCP_ACCESS_TOKEN}
async function readProject(env){try{return JSON.parse(await env.AURORA_KV.get("project:main"))||{name:"Meu jogo",mode:"2D",width:1280,height:720,objects:[]}}catch{return {name:"Meu jogo",mode:"2D",width:1280,height:720,objects:[]}}}
async function writeProject(env,p){await env.AURORA_KV.put("project:main",JSON.stringify(p))}
function toolResult(text,structured){return {content:[{type:"text",text}],structuredContent:structured,isError:false}}
const tools=[
 {name:"get_scene",description:"Lê a cena atual do Aurora Engine e lista seus objetos.",inputSchema:{type:"object",properties:{},additionalProperties:false}},
 {name:"create_object",description:"Cria um objeto na cena. Tipos: rect, circle, text, star.",inputSchema:{type:"object",properties:{type:{type:"string",enum:["rect","circle","text","star"]},name:{type:"string"},x:{type:"number"},y:{type:"number"},w:{type:"number"},h:{type:"number"},color:{type:"string"},text:{type:"string"},fontSize:{type:"number"}},required:["type"],additionalProperties:false}},
 {name:"update_object",description:"Atualiza um objeto existente pelo nome ou ID.",inputSchema:{type:"object",properties:{id:{type:"string"},name:{type:"string"},changes:{type:"object",properties:{name:{type:"string"},x:{type:"number"},y:{type:"number"},w:{type:"number"},h:{type:"number"},color:{type:"string"},text:{type:"string"},fontSize:{type:"number"}},additionalProperties:false}},required:["changes"],additionalProperties:false}},
 {name:"delete_object",description:"Exclui um objeto existente pelo nome ou ID.",inputSchema:{type:"object",properties:{id:{type:"string"},name:{type:"string"}},additionalProperties:false}},
 {name:"replace_scene",description:"Substitui a cena inteira pelos objetos fornecidos.",inputSchema:{type:"object",properties:{name:{type:"string"},objects:{type:"array",maxItems:300,items:{type:"object",properties:{type:{type:"string",enum:["rect","circle","text","star"]},name:{type:"string"},x:{type:"number"},y:{type:"number"},w:{type:"number"},h:{type:"number"},color:{type:"string"},text:{type:"string"},fontSize:{type:"number"}},required:["type"],additionalProperties:false}}},required:["objects"],additionalProperties:false}}
];
async function callTool(env,name,args){
 let p=await readProject(env);p.objects=Array.isArray(p.objects)?p.objects:[];
 if(name==="get_scene")return toolResult(JSON.stringify(p,null,2),p);
 if(name==="create_object"){
  if(!["rect","circle","text","star"].includes(args.type))throw Error("Tipo inválido.");
  const o={id:uid(),type:args.type,name:String(args.name||"Objeto").slice(0,60),x:clamp(args.x,0,1280,640),y:clamp(args.y,0,720,360),w:clamp(args.w,10,700,140),h:clamp(args.h,10,700,100),color:validColor(args.color)?args.color:"#d7ad58",text:String(args.text||"Texto").slice(0,200),fontSize:clamp(args.fontSize,8,160,42)};
  p.objects.push(o);await writeProject(env,p);return toolResult("Objeto criado: "+o.name,o);
 }
 if(name==="update_object"){
  const o=p.objects.find(x=>(args.id&&x.id===args.id)||(args.name&&x.name===args.name));if(!o)throw Error("Objeto não encontrado.");
  const c=args.changes||{};if(typeof c.name==="string")o.name=c.name.slice(0,60);
  for(const k of ["x","y","w","h","fontSize"])if(c[k]!==undefined){const bounds={x:[0,1280],y:[0,720],w:[10,700],h:[10,700],fontSize:[8,160]}[k];o[k]=clamp(c[k],...bounds,o[k])}
  if(c.color!==undefined){if(!validColor(c.color))throw Error("Cor deve estar no formato hexadecimal #RRGGBB.");o.color=c.color}
  if(typeof c.text==="string")o.text=c.text.slice(0,200);
  await writeProject(env,p);return toolResult("Objeto atualizado: "+o.name,o);
 }
 if(name==="delete_object"){
  const n=p.objects.length;p.objects=p.objects.filter(x=>!((args.id&&x.id===args.id)||(args.name&&x.name===args.name)));if(n===p.objects.length)throw Error("Objeto não encontrado.");
  await writeProject(env,p);return toolResult("Objeto excluído.",{deleted:n-p.objects.length});
 }
 if(name==="replace_scene"){
  if(!Array.isArray(args.objects)||args.objects.length>300)throw Error("A cena aceita até 300 objetos.");
  p.name=String(args.name||p.name||"Meu jogo").slice(0,80);
  p.objects=args.objects.map(a=>({id:uid(),type:["rect","circle","text","star"].includes(a.type)?a.type:"rect",name:String(a.name||"Objeto").slice(0,60),x:clamp(a.x,0,1280,640),y:clamp(a.y,0,720,360),w:clamp(a.w,10,700,140),h:clamp(a.h,10,700,100),color:validColor(a.color)?a.color:"#d7ad58",text:String(a.text||"Texto").slice(0,200),fontSize:clamp(a.fontSize,8,160,42)}));
  await writeProject(env,p);return toolResult("Cena substituída: "+p.objects.length+" objetos.",p);
 }
 throw Error("Ferramenta desconhecida.");
}
export default {async fetch(req,env){
 const u=new URL(req.url);if(req.method==="OPTIONS")return new Response(null,{headers:cors});
 if(u.pathname==="/health")return json({ok:true,service:"Aurora Engine Worker",mcp:"/mcp",requiresKV:true,requiresMcpToken:true});
 if(u.pathname==="/chat"&&req.method==="POST"){
  if(!env.OPENROUTER_API_KEY)return json({error:"Configure OPENROUTER_API_KEY no Cloudflare."},503);
  try{const body=await req.json();const system=`Você é Aurora AI, assistente do Aurora Engine. Responda em português brasileiro e em JSON válido: {"reply":"...","actions":[]}. Ações: create_object com object {type rect|circle|text|star,name,x,y,w,h,color,text,fontSize}; update_object com name e changes; delete_object com name. Máximo 20 ações. Não afirme ter alterado se não incluir a ação.`;
   const upstream=await fetch("https://openrouter.ai/api/v1/chat/completions",{method:"POST",headers:{"Authorization":"Bearer "+env.OPENROUTER_API_KEY,"Content-Type":"application/json","HTTP-Referer":"https://ohivyyctcvyovy-dotcom.github.io/aurora-engine/","X-Title":"Aurora Engine"},body:JSON.stringify({model:env.OPENROUTER_MODEL||"openrouter/auto",messages:[{role:"system",content:system},{role:"user",content:"Pedido: "+String(body.message||"").slice(0,4000)+"\nCena: "+JSON.stringify(body.project||{}).slice(0,16000)}],temperature:.3})});
   const d=await upstream.json();if(!upstream.ok)return json({error:d.error?.message||"Erro no provedor."},502);
   const raw=d.choices?.[0]?.message?.content||"{}";let parsed;try{parsed=JSON.parse(raw.replace(/^\s*```(?:json)?/i,"").replace(/```\s*$/,"").trim())}catch{parsed={reply:raw,actions:[]}}
   return json({reply:String(parsed.reply||"Resposta recebida."),actions:Array.isArray(parsed.actions)?parsed.actions.slice(0,20):[]});
  }catch(e){return json({error:e.message},500)}
 }
 if(u.pathname==="/.well-known/oauth-protected-resource")return json({resource:u.origin+"/mcp",authorization_servers:[u.origin],bearer_methods_supported:["header"],scopes_supported:["aurora:edit"]});
 if(u.pathname==="/.well-known/oauth-authorization-server")return json({issuer:u.origin,authorization_endpoint:u.origin+"/authorize",token_endpoint:u.origin+"/token",registration_endpoint:u.origin+"/register",response_types_supported:["code"],grant_types_supported:["authorization_code"],code_challenge_methods_supported:["S256"],token_endpoint_auth_methods_supported:["none"],scopes_supported:["aurora:edit"]});
 if(u.pathname==="/register"&&req.method==="POST"){
  if(!env.AURORA_KV)return json({error:"KV AURORA_KV não configurado."},503);
  const b=await req.json();if(!Array.isArray(b.redirect_uris)||!b.redirect_uris.length)return json({error:"redirect_uris obrigatório."},400);
  const id=uid();await env.AURORA_KV.put("oauth-client:"+id,JSON.stringify({redirect_uris:b.redirect_uris,client_name:b.client_name||"MCP Client"}));
  return json({client_id:id,client_name:b.client_name||"MCP Client",redirect_uris:b.redirect_uris,token_endpoint_auth_method:"none",grant_types:["authorization_code"],response_types:["code"]},201);
 }
 if(u.pathname==="/pair/start"&&req.method==="POST"){
  if(!env.AURORA_KV)return json({error:"KV AURORA_KV não configurado."},503);
  const code=String(Math.floor(100000+Math.random()*900000));await env.AURORA_KV.put("pair:"+code,JSON.stringify({created:Date.now()}),{expirationTtl:600});
  return json({code,expires_in:600,message:"Código de pareamento válido por 10 minutos."});
 }
 if(u.pathname==="/authorize"&&req.method==="GET"){
  const p=u.searchParams;const client=await env.AURORA_KV?.get("oauth-client:"+p.get("client_id"));
  if(!client)return new Response("Cliente OAuth inválido.",{status:400});
  const html=`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Conectar Aurora Engine</title><body style="background:#0b0b0d;color:#f4f0e8;font:16px system-ui;max-width:440px;margin:12vh auto;padding:24px"><h2 style="color:#e6c47c">Conectar ao Aurora Engine</h2><p>Digite o código de pareamento gerado no editor Aurora Engine para autorizar este cliente a ler e editar a cena.</p><form method="post" action="/authorize"><input type="hidden" name="client_id" value="${p.get("client_id")||""}"><input type="hidden" name="redirect_uri" value="${p.get("redirect_uri")||""}"><input type="hidden" name="state" value="${p.get("state")||""}"><input type="hidden" name="code_challenge" value="${p.get("code_challenge")||""}"><input type="hidden" name="code_challenge_method" value="${p.get("code_challenge_method")||""}"><input name="pair_code" inputmode="numeric" required placeholder="Código de 6 dígitos" style="padding:12px;width:100%;box-sizing:border-box;background:#18181d;color:white;border:1px solid #9a783d;border-radius:8px"><button style="margin-top:14px;padding:12px 18px;background:#d7ad58;border:0;border-radius:8px;font-weight:bold">Autorizar acesso à cena</button></form><p style="color:#aaa;font-size:12px">O código expira em 10 minutos. Você pode revogar o token no painel do Worker.</p></body>`;
  return new Response(html,{headers:{"Content-Type":"text/html; charset=utf-8"}});
 }
 if(u.pathname==="/authorize"&&req.method==="POST"){
  const form=await req.formData(),code=String(form.get("pair_code")||""),pair=await env.AURORA_KV?.get("pair:"+code);
  if(!pair)return new Response("Código inválido ou expirado. Gere outro código no editor.",{status:400});
  const clientId=String(form.get("client_id")||""),clientRaw=await env.AURORA_KV?.get("oauth-client:"+clientId);if(!clientRaw)return new Response("Cliente OAuth inválido.",{status:400});
  const client=JSON.parse(clientRaw),redirect=String(form.get("redirect_uri")||"");if(!client.redirect_uris.includes(redirect))return new Response("URL de retorno não autorizada.",{status:400});
  const verifier=String(form.get("code_challenge")||"");if(!verifier||form.get("code_challenge_method")!=="S256")return new Response("PKCE S256 obrigatório.",{status:400});
  await env.AURORA_KV.delete("pair:"+code);const authCode=uid();await env.AURORA_KV.put("authcode:"+authCode,JSON.stringify({clientId,redirect,challenge:verifier,created:Date.now()}),{expirationTtl:300});
  return Response.redirect(redirect+(redirect.includes("?")?"&":"?")+"code="+authCode+"&state="+encodeURIComponent(String(form.get("state")||"")),302);
 }
 if(u.pathname==="/token"&&req.method==="POST"){
  const f=await req.formData(),code=String(f.get("code")||""),entry=await env.AURORA_KV?.get("authcode:"+code);if(!entry)return json({error:"Código OAuth inválido ou expirado."},400);
  const a=JSON.parse(entry);await env.AURORA_KV.delete("authcode:"+code);if(String(f.get("client_id")||"")!==a.clientId||String(f.get("redirect_uri")||"")!==a.redirect)return json({error:"Cliente ou redirect inválido."},400);
  if(await hash(String(f.get("code_verifier")||""))!==a.challenge)return json({error:"PKCE inválido."},400);
  const token=uid()+uid();await env.AURORA_KV.put("access:"+await hash(token),JSON.stringify({clientId:a.clientId,scope:"aurora:edit"}),{expirationTtl:86400*30});
  return json({access_token:token,token_type:"Bearer",expires_in:86400*30,scope:"aurora:edit"});
 }
 if(u.pathname==="/mcp"&&(req.method==="POST"||req.method==="GET")){
  if(!env.AURORA_KV)return json({error:"KV AURORA_KV não configurado."},503);
  const bearer=(req.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"");const session= bearer?await env.AURORA_KV.get("access:"+await hash(bearer)):null;
  if(!session)return json({error:"Unauthorized",authorization:"Bearer"},401,{"WWW-Authenticate":'Bearer resource_metadata="'+u.origin+'/.well-known/oauth-protected-resource"'});
  if(req.method==="GET")return new Response("MCP Streamable HTTP endpoint",{headers:{...cors,"Content-Type":"text/plain"}});
  const m=await req.json();const id=m.id??null;
  try{
   let result;
   if(m.method==="initialize")result={protocolVersion:"2025-03-26",capabilities:{tools:{listChanged:false}},serverInfo:{name:"aurora-engine",version:"1.0.0"}};
   else if(m.method==="notifications/initialized")return new Response(null,{status:202,headers:cors});
   else if(m.method==="ping")result={};
   else if(m.method==="tools/list")result={tools};
   else if(m.method==="tools/call"){const name=m.params?.name,args=m.params?.arguments||{};const r=await callTool(env,name,args);result=r}
   else return json({jsonrpc:"2.0",id,error:{code:-32601,message:"Method not found"}});
   return json({jsonrpc:"2.0",id,result});
  }catch(e){return json({jsonrpc:"2.0",id,error:{code:-32000,message:e.message}})}
 }
 if(u.pathname==="/project/sync"&&req.method==="POST"){
  // Token exclusivo do editor: compartilhado com MCP por meio do armazenamento KV.
  const key=req.headers.get("X-Aurora-Project-Key");if(!key||!env.AURORA_KV)return json({error:"Projeto não autorizado."},401);
  const expected=await env.AURORA_KV.get("editor-key");if(!expected||key!==expected)return json({error:"Chave do editor inválida."},403);
  const p=await req.json();if(!Array.isArray(p.objects)||p.objects.length>300)return json({error:"Cena inválida."},400);await writeProject(env,p);return json({ok:true});
 }
 if(u.pathname==="/project/read"&&req.method==="GET"){
  const key=req.headers.get("X-Aurora-Project-Key"),expected=await env.AURORA_KV?.get("editor-key");if(!key||!expected||key!==expected)return json({error:"Projeto não autorizado."},403);return json(await readProject(env));
 }
 return json({error:"Not found"},404);
}};
