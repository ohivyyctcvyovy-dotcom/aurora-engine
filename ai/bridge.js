// Aurora Forja — planejamento e construção em lotes usando o Worker seguro da Aurora.
function snapshotForAI(project){
 const p=project||{};
 return {name:p.name||"Meu jogo",mode:p.mode||"2D",width:p.width||1280,height:p.height||720,
  objects:(p.objects||[]).slice(-18).map(o=>({type:o.type,name:o.name,x:o.x,y:o.y,w:o.w,h:o.h,color:o.color})),
  objects3d:(p.objects3d||[]).slice(-18).map(o=>({kind:o.kind,name:o.name,x:o.x,y:o.y,z:o.z,sx:o.sx,sy:o.sy,sz:o.sz,color:o.color}))};
}
function parseReply(raw){
 const s=String(raw||"").trim().replace(/^\s*```(?:json)?\s*/i,"").replace(/\s*```\s*$/,"");
 try{return JSON.parse(s)}catch{}
 const a=s.indexOf("{"),b=s.lastIndexOf("}");
 if(a>=0&&b>a){try{return JSON.parse(s.slice(a,b+1))}catch{}}
 return null;
}
export function createAIClient({getEndpoint,getProject,onMessage,applyActions,onCode,onProgress}){
 function progress(message){try{onProgress?.(message)}catch{}}
 function showError(message){onMessage("assistant","Não consegui conectar à Aurora: "+message+"\nConfira o endereço do Worker e tente novamente.");progress("")}
 async function request(endpoint,content){
  // O Worker atual limita o conteúdo recebido; manter cada etapa compacta evita truncamento.
  if(content.length>2850)content=content.slice(0,2850);
  const response=await fetch(endpoint+"/chat",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},cache:"no-store",body:JSON.stringify({messages:[{role:"user",content}]})});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error||"O servidor respondeu HTTP "+response.status+".");
  const raw=typeof data.reply==="string"?data.reply:(typeof data.answer==="string"?data.answer:"");
  if(!raw.trim())throw new Error("A API não retornou uma resposta.");
  return {raw,parsed:parseReply(raw)};
 }
 async function ask(prompt){
  const endpoint=String(getEndpoint()||"").trim().replace(/\/+$/,"");
  if(!endpoint)throw new Error("Configure o endereço da API Aurora.");
  const original=String(prompt||"").trim();
  const initial=snapshotForAI(getProject?.());
  onMessage("user",original);
  progress("Forja: interpretando seu pedido…");
  const rules=[
   "Você é a FORJA da Aurora Engine. Responda SOMENTE JSON válido: {\"intent\":\"build|chat|question|code\",\"reply\":\"...\",\"actions\":[],\"done\":true,\"code\":\"\"}.",
   "Se o pedido solicitar criar ou alterar a cena, use intent build e envie ações executáveis. Se for só conversa/pergunta, use chat/question sem ações. Nunca afirme que criou sem ações.",
   "Modo atual: "+initial.mode+". Use esse modo, salvo pedido explícito diferente. Preserve objetos existentes; nunca substitua a cena sem pedido explícito.",
   "Ações 2D: {\"type\":\"create_object\",\"object\":{\"type\":\"rect|circle|text|star|character|sprite|platform|scenario|collision|house|tree|mountain|cloud|water|road|bridge|building\",\"name\":\"...\",\"x\":0,\"y\":0,\"w\":100,\"h\":100,\"color\":\"#RRGGBB\",\"text\":\"\",\"animated\":false,\"collision\":false}}.",
   "Ações 3D: {\"type\":\"create_3d_object\",\"object\":{\"kind\":\"cube|sphere|terrain|building|character|tree|camera|light|house|castle|bridge|road|water|mountain|rock|lamp|bench|fountain|portal|forest|village|city|temple|room\",\"name\":\"...\",\"x\":0,\"y\":0,\"z\":0,\"sx\":1,\"sy\":1,\"sz\":1,\"rx\":0,\"ry\":0,\"rz\":0,\"color\":\"#RRGGBB\"}}.",
   "Também pode usar update_object/delete_object/update_3d_object/delete_3d_object com name e changes. No máximo 4 ações por etapa. Coordenadas e escalas devem compor uma cena organizada, com tamanhos coerentes e sem sobreposições desnecessárias.",
   "Prefabs como vila, cidade, castelo, floresta, templo e interior já são compostos. Para personagens, crie representação visual e marque animated=true somente se desejar animação visual simples; não prometa rig/esqueleto ou animação avançada que não exista no editor.",
   "Pedido original: "+original.slice(0,850),
   "Resumo da cena atual: "+JSON.stringify(initial).slice(0,950)
  ].join("\n");
  let result=await request(endpoint,rules),parsed=result.parsed;
  if(!parsed){onMessage("assistant","A Forja recebeu uma resposta que não veio em JSON válido. Nenhuma alteração foi aplicada.");progress("");return {applied:false}}
  let intent=String(parsed.intent||(Array.isArray(parsed.actions)&&parsed.actions.length?"build":"chat")).toLowerCase();
  if(intent!=="build"){
   if(typeof parsed.code==="string"&&parsed.code.trim())onCode?.(parsed.code);
   onMessage("assistant",String(parsed.reply||result.raw));progress("");return {applied:false,parsed};
  }
  let appliedAny=false,total=0,round=0,reply=String(parsed.reply||"A Forja começou a construir a cena.");
  let current=parsed;
  while(round<5){
   const actions=Array.isArray(current.actions)?current.actions.slice(0,4):[];
   if(!actions.length)break;
   progress("Forja: aplicando etapa "+(round+1)+"…");
   let ok=false;
   try{ok=!!applyActions?.(actions)}catch{ok=false}
   if(!ok)break;
   appliedAny=true;total+=actions.length;round++;
   if(current.done===true||round>=5)break;
   const state=snapshotForAI(getProject?.());
   const continuation=[
    "Continue a construção na cena Aurora. Responda SOMENTE JSON válido no mesmo formato, com no máximo 4 ações novas.",
    "Não repita objetos que já existem. Não substitua a cena. Mantenha escala, alinhamento e coerência com o que já foi construído.",
    "Pedido original: "+original.slice(0,700),
    "Já foram aplicadas "+total+" ações. Se a construção estiver completa, retorne actions:[] e done:true. Caso contrário, crie a próxima parte e marque done:true apenas quando terminar.",
    "Cena atual: "+JSON.stringify(state).slice(0,1250)
   ].join("\n");
   progress("Forja: planejando a próxima etapa…");
   const next=await request(endpoint,continuation);
   current=next.parsed||{};
   if(!next.parsed)break;
   if(String(current.intent||"build").toLowerCase()!=="build")break;
  }
  if(typeof parsed.code==="string"&&parsed.code.trim())onCode?.(parsed.code);
  let message=reply;
  if(appliedAny)message+="\n\nForja concluída parcialmente ou totalmente: "+total+" ações aplicadas na cena. Você já pode ver o resultado e usar Desfazer.";
  else message="A Forja não recebeu ações válidas para materializar o pedido. Nenhum objeto foi adicionado.";
  if(round===5&&current.done!==true)message+="\nA construção atingiu o limite de etapas desta solicitação; peça para continuar para adicionar o restante.";
  if(typeof parsed.code==="string"&&parsed.code.trim())message+="\nO código foi colocado no Editor de Código para revisão; ele não foi executado automaticamente.";
  onMessage("assistant",message);progress("");
  return {applied:appliedAny,total,parsed};
 }
 return {ask,showError};
}
