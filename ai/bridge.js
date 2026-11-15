// Aurora Forja — cliente compatível com o Worker /chat e controles de voz para Android.
function snapshotForAI(project){
 const p=project||{};
 return {name:p.name||"Meu jogo",mode:p.mode||"2D",width:p.width||1280,height:p.height||720,
  objects:(p.objects||[]).slice(-18).map(o=>({type:o.type,name:o.name,x:o.x,y:o.y,w:o.w,h:o.h,color:o.color})),
  objects3d:(p.objects3d||[]).slice(-18).map(o=>({kind:o.kind,name:o.name,x:o.x,y:o.y,z:o.z,sx:o.sx,sy:o.sy,sz:o.sz,color:o.color}))};
}
function parseReply(raw){
 const tick=String.fromCharCode(96),fence=new RegExp("^\\s*"+tick+"{3}(?:json)?\\s*","i"),endFence=new RegExp("\\s*"+tick+"{3}\\s*$");
 const s=String(raw||"").trim().replace(fence,"").replace(endFence,"");
 try{return JSON.parse(s)}catch{}
 const a=s.indexOf("{"),b=s.lastIndexOf("}");
 if(a>=0&&b>a){try{return JSON.parse(s.slice(a,b+1))}catch{}}
 return null;
}
function installVoiceControls(){
 const area=document.querySelector(".aiInput"),prompt=document.getElementById("aiPrompt"),status=document.getElementById("forjaStatus");
 if(!area||!prompt||area.dataset.voiceReady)return;
 area.dataset.voiceReady="1";
 const controls=document.createElement("div");controls.style.cssText="display:flex;gap:8px;flex-wrap:wrap";
 const mic=document.createElement("button");mic.type="button";mic.textContent="🎙 Falar";mic.setAttribute("aria-label","Ditado por voz em português");
 const listen=document.createElement("button");listen.type="button";listen.textContent="🔊 Ouvir resposta";listen.setAttribute("aria-label","Ler em voz alta a última resposta");
 controls.append(mic,listen);area.insertBefore(controls,area.querySelector("#sendAI"));
 const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;let recognition=null;
 if(SpeechRecognition){
  recognition=new SpeechRecognition();recognition.lang="pt-BR";recognition.interimResults=false;recognition.maxAlternatives=1;
  recognition.onstart=()=>{mic.textContent="■ Parar de ouvir";if(status)status.textContent="Estou ouvindo. Fale seu pedido em português."};
  recognition.onresult=e=>{const spoken=e.results?.[0]?.[0]?.transcript||"";if(spoken){prompt.value=(prompt.value.trim()?prompt.value.trim()+" ":"")+spoken;prompt.focus();if(status)status.textContent="Voz convertida em texto. Revise e toque em Construir com a Forja."}};
  recognition.onerror=e=>{if(status)status.textContent=e.error==="not-allowed"?"Permita o uso do microfone nas configurações do navegador.":"Não consegui reconhecer a fala. Tente novamente ou digite o pedido."};
  recognition.onend=()=>{mic.textContent="🎙 Falar"};
 }else{mic.disabled=true;mic.title="Reconhecimento de voz não disponível neste navegador";mic.textContent="🎙 Voz indisponível";}
 mic.addEventListener("click",()=>{if(!recognition)return;try{if(mic.textContent.includes("Parar"))recognition.stop();else recognition.start()}catch{if(status)status.textContent="O microfone já está ativo. Aguarde terminar."}});
 listen.addEventListener("click",()=>{
  const text=window.__auroraLastAssistantText||"Ainda não há uma resposta para ouvir.";
  if(!("speechSynthesis" in window)){if(status)status.textContent="Leitura em voz alta não está disponível neste navegador.";return}
  window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text);utterance.lang="pt-BR";utterance.rate=.96;window.speechSynthesis.speak(utterance);
 });
}
function installMobileComfort(){
 if(document.getElementById("aurora-mobile-comfort"))return;
 const style=document.createElement("style");style.id="aurora-mobile-comfort";
 style.textContent="@media(max-width:900px){button,input,select,textarea{font-size:16px}button{min-height:42px;touch-action:manipulation}#aiPrompt{min-height:88px}#aiMessages{overscroll-behavior:contain}body{padding-bottom:env(safe-area-inset-bottom)}}@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation-duration:.01ms!important;transition-duration:.01ms!important}}";
 document.head.appendChild(style);
}
export function createAIClient({getEndpoint,getProject,onMessage,applyActions,onCode,onProgress}){
 function progress(message){try{onProgress?.(message)}catch{}}
 function say(role,message){if(role!=="user")window.__auroraLastAssistantText=String(message||"");onMessage(role,message)}
 function showError(message){say("assistant","Não consegui conectar à Aurora: "+message+"\nConfira o endereço do Worker e tente novamente.");progress("")}
 async function request(endpoint,content,project){
  if(content.length>7000)content=content.slice(0,7000);
  const response=await fetch(endpoint+"/chat",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},cache:"no-store",body:JSON.stringify({message:content,project:project||{}})});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error||"O servidor respondeu HTTP "+response.status+".");
  if(Array.isArray(data.actions))return {raw:String(data.reply||"Resposta recebida."),parsed:{intent:data.actions.length?"build":"chat",reply:String(data.reply||"Resposta recebida."),actions:data.actions,done:true}};
  const raw=typeof data.reply==="string"?data.reply:(typeof data.answer==="string"?data.answer:"");
  if(!raw.trim())throw new Error("A API não retornou uma resposta.");
  return {raw,parsed:parseReply(raw)};
 }
 async function ask(prompt){
  const endpoint=String(getEndpoint()||"").trim().replace(/\/+$/,""),original=String(prompt||"").trim();
  if(!endpoint)throw new Error("Configure o endereço da API Aurora.");
  if(!original)throw new Error("Escreva ou dite o que deseja criar.");
  let project=snapshotForAI(getProject?.());say("user",original);progress("Forja: interpretando seu pedido…");
  const rules=[
   "Você é a FORJA da Aurora Engine. Responda SOMENTE JSON válido: {\"intent\":\"build|chat|question|code\",\"reply\":\"...\",\"actions\":[],\"done\":true,\"code\":\"\"}.",
   "Para criar ou alterar a cena use intent build e ações executáveis. Para conversa/pergunta use chat/question sem ações. Nunca afirme que criou sem ações.",
   "Modo atual: "+project.mode+". Preserve objetos existentes e nunca substitua a cena sem pedido explícito.",
   "Ações 2D: {\"type\":\"create_object\",\"object\":{\"type\":\"rect|circle|text|star|character|sprite|platform|scenario|collision|house|tree|mountain|cloud|water|road|bridge|building\",\"name\":\"...\",\"x\":0,\"y\":0,\"w\":100,\"h\":100,\"color\":\"#RRGGBB\",\"text\":\"\"}}.",
   "Ações 3D: {\"type\":\"create_3d_object\",\"object\":{\"kind\":\"cube|sphere|terrain|building|character|tree|camera|light|house|castle|bridge|road|water|mountain|rock|lamp|bench|fountain|portal|forest|village|city|temple|room\",\"name\":\"...\",\"x\":0,\"y\":0,\"z\":0,\"sx\":1,\"sy\":1,\"sz\":1,\"color\":\"#RRGGBB\"}}.",
   "Também pode usar update_object/delete_object/update_3d_object/delete_3d_object com name e changes. No máximo 4 ações por etapa. Use nomes únicos e posições coerentes.",
   "Não execute código. Se gerar JavaScript, coloque no campo code para revisão manual.",
   "Pedido: "+original.slice(0,1200),"Cena atual: "+JSON.stringify(project).slice(0,2500)
  ].join("\n");
  try{
   let result=await request(endpoint,rules,project),parsed=result.parsed;
   if(!parsed){say("assistant","A API respondeu, mas o formato não foi reconhecido. Nenhuma alteração foi aplicada.");progress("");return {applied:false}}
   const intent=String(parsed.intent||(Array.isArray(parsed.actions)&&parsed.actions.length?"build":"chat")).toLowerCase();
   if(intent!=="build"){if(typeof parsed.code==="string"&&parsed.code.trim())onCode?.(parsed.code);say("assistant",String(parsed.reply||result.raw));progress("");return {applied:false,parsed}}
   let appliedAny=false,total=0,round=0,current=parsed,reply=String(parsed.reply||"A Forja começou a construir a cena.");
   while(round<5){
    const actions=Array.isArray(current.actions)?current.actions.slice(0,4):[];if(!actions.length)break;
    progress("Forja: aplicando etapa "+(round+1)+"…");let ok=false;try{ok=!!applyActions?.(actions)}catch{}
    if(!ok)break;appliedAny=true;total+=actions.length;round++;if(current.done===true||round>=5)break;
    project=snapshotForAI(getProject?.());
    const continuation=["Continue a construção na cena Aurora. Responda SOMENTE JSON válido com no máximo 4 ações novas.","Não repita objetos existentes. Preserve a cena e mantenha alinhamento e escala coerentes.","Pedido original: "+original.slice(0,900),"Já foram aplicadas "+total+" ações. Se terminou, actions:[] e done:true. Cena atual: "+JSON.stringify(project).slice(0,2500)].join("\n");
    progress("Forja: planejando a próxima etapa…");const next=await request(endpoint,continuation,project);current=next.parsed||{};
    if(!next.parsed||String(current.intent||"build").toLowerCase()!=="build")break;
   }
   if(typeof parsed.code==="string"&&parsed.code.trim())onCode?.(parsed.code);
   let message=appliedAny?reply+"\n\nForja aplicou "+total+" ações na cena. Você pode revisar o resultado e usar Desfazer.":"A Forja não recebeu ações válidas. Nenhum objeto foi adicionado.";
   if(round===5&&current.done!==true)message+="\nA construção chegou ao limite desta solicitação. Peça para continuar.";
   if(typeof parsed.code==="string"&&parsed.code.trim())message+="\nO código foi colocado no Editor de Código para revisão; não foi executado automaticamente.";
   say("assistant",message);progress("");return {applied:appliedAny,total,parsed};
  }catch(error){showError(error?.message||"erro desconhecido");return {applied:false,error}}
 }
 installVoiceControls();installMobileComfort();return {ask,showError};
}
