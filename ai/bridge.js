// Aurora AI Bridge — conecta o editor à API já existente da Aurora.
function compactProject(project) {
  const p = project || {};
  return {
    name: p.name || "Meu jogo",
    mode: p.mode || "2D",
    width: p.width || 1280,
    height: p.height || 720,
    objects: (Array.isArray(p.objects) ? p.objects : []).slice(0, 24).map(o => ({
      id:o.id,type:o.type,name:o.name,x:o.x,y:o.y,w:o.w,h:o.h,color:o.color,
      text:o.text,animated:!!o.animated,collision:!!o.collision
    })),
    objects3d: (Array.isArray(p.objects3d) ? p.objects3d : []).slice(0, 20).map(o => ({
      id:o.id,kind:o.kind,name:o.name,x:o.x,y:o.y,z:o.z,
      sx:o.sx,sy:o.sy,sz:o.sz,rx:o.rx,ry:o.ry,rz:o.rz,color:o.color
    }))
  };
}
function parseStructuredReply(raw) {
  const text = String(raw || "").trim()
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "");
  try { return JSON.parse(text); } catch {}
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first >= 0 && last > first) {
    try { return JSON.parse(text.slice(first, last + 1)); } catch {}
  }
  return null;
}
export function createAIClient({getEndpoint,getProject,onMessage,applyActions,onCode}) {
  function applySafely(actions) {
    try { return !!applyActions?.(actions); }
    catch { return false; }
  }
  function showError(message) {
    onMessage("assistant","Não consegui conectar à Aurora: "+message+
      "\nConfira se o endereço da API está correto e se o Worker está disponível.");
  }
  async function ask(prompt) {
    const endpoint = String(getEndpoint() || "").trim().replace(/\/+$/, "");
    if (!endpoint) throw new Error("Configure o endereço da API Aurora.");
    const project = compactProject(getProject?.());
    const instructions = [
      "Você é Aurora AI, construtora de jogos integrada ao editor. Responda em português brasileiro.",
      "Interprete a intenção, não exija palavras-chave ou comandos técnicos. O usuário pode contar uma ideia, descrever uma situação ou explicar informalmente como imagina um lugar, personagem, objeto, fase, interface ou construção, sem dizer literalmente 'crie'. Se a mensagem indicar que quer materializar algo no projeto, classifique intent como 'build' e gere ações executáveis. Nunca exija termos como create_object, 2D, 3D, player, floor ou wall. Se faltar detalhe não essencial, escolha uma solução visual coerente e construa. Só use intent 'chat' ou 'question' quando a pessoa estiver apenas conversando, perguntando ou pedindo sugestões sem solicitar alteração da cena. Identifique o modo pelo editor atual, a menos que a pessoa peça outro modo.",
      "Antes de gerar ações, interprete: objetivo, dimensões/unidades, quantidade de elementos, posições relativas, conexões, aparência e interações pedidas. Transforme medidas como grade 5x5 em layout regular, com espaçamento uniforme e limites claros.",
      "Planeje a cena como um conjunto coerente: alinhe objetos, mantenha escala consistente, evite sobreposições, deixe passagens livres e conecte caminhos, salas, corredores e entradas. Use coordenadas calculadas; não espalhe objetos aleatoriamente nem use posições enormes sem necessidade.",
      "Para pedidos 2D, pense como designer de fases: organize camadas (fundo, cenário, piso/plataformas, obstáculos, objetos, personagens e textos), use 1280x720 como referência, distribua elementos com proporções e espaçamento consistentes e não coloque tudo no centro. Em mapas, use linhas e colunas regulares; em interiores, mantenha corredores e vãos livres; em paisagens, combine fundo, terreno e elementos em planos distintos.",
      "Interprete pedidos variados, não apenas mapas: menus, telas iniciais, vilas, cidades, florestas, interiores, plataformas, fases de aventura, cenários de corrida, objetos decorativos, personagens e interfaces. Extraia cada elemento, quantidade, tamanho aproximado, estilo e posição relativa. Se o pedido for amplo, monte uma composição coerente em vez de criar apenas um objeto genérico.",
      "No 2D, escolha tipos conforme a função visual: rect para formas/estruturas, platform para pisos, scenario para fundo, character/sprite para personagens, text para rótulos e prefabs house/tree/mountain/cloud/water/road/bridge/building quando adequados. Varie largura e altura conforme o objeto; não use o mesmo tamanho para tudo.",
      "Se o pedido descrever salas, mapa ou edifício, construa a planta de forma lógica: piso, paredes externas, divisórias, vãos de passagem e portas representadas por objetos. Se pedir uma quantidade exata, respeite-a. Não diga que uma porta ou comportamento é funcional se o editor só criar a representação visual.",
      "Seja fiel ao pedido e ao contexto da cena. Preserve os objetos existentes; acrescente ou atualize apenas o necessário. Só substitua ou apague a cena quando isso for solicitado explicitamente. Se faltar um detalhe não essencial, escolha uma solução sensata e informe brevemente a escolha.",
      "Retorne SOMENTE JSON válido, sem Markdown: {\"intent\":\"build|chat|question|code\",\"reply\":\"resumo curto\",\"actions\":[],\"code\":\"\"}. intent='build' significa materializar a ideia na cena e exige ações válidas e suficientes. Classifique pela intenção e pelo contexto, não por palavras-chave. Nunca diga que criou se não enviou ações. Para 3D, confira coordenadas e escalas visíveis; para 2D, use coordenadas dentro de 1280x720. Não use código como substituto de objetos visuais quando as ações do editor forem suficientes.",
      "Ações 2D: create_object com object {type:rect|circle|text|star|character|sprite|platform|scenario|collision|house|tree|mountain|cloud|water|road|bridge|building,name,x,y,w,h,color,text,fontSize,animated,collision}. Também update_object com name e changes, delete_object com name, replace_scene com objects apenas se o usuário pedir substituição.",
      "Ações 3D: create_3d_object com object {kind:cube|sphere|terrain|building|character|tree|camera|light|house|castle|bridge|road|water|mountain|rock|lamp|bench|fountain|portal|forest|village|city|temple|room,name,x,y,z,sx,sy,sz,rx,ry,rz,color}. Também update_3d_object e delete_3d_object com name. Para paredes, pisos, portas, mesas, cadeiras, janelas e colunas, use cube com name descritivo e sx/sy/sz adequados. Prefabs compostos economizam ações, mas use vários objetos quando o pedido exigir partes separadas.",
      "O editor aceita até 60 ações por resposta. Planeje a composição e envie todas as ações necessárias dentro do limite. Prefira prefabs compostos para construções complexas, mas não reduza uma cena inteira a um cubo genérico. Se exceder a capacidade, construa a estrutura principal e explique o que ficou pendente.",
      "Personagens podem ter aparência, posição e escala. Para interações não violentas, descreva lógica genérica apenas quando suportada; não afirme que comportamentos foram instalados se só criou objetos. Não crie armas nem instruções de combate.",
      "Só preencha code quando o usuário pedir código ou uma lógica que o editor não consegue representar por ações; esse código é inserido para revisão e não é executado automaticamente.",
      "Contexto do projeto atual: " + JSON.stringify(project).slice(0, 1400),
      "Pedido completo do usuário: " + String(prompt || "").slice(0, 900)
    ].join("\n");
    onMessage("user", prompt);
    async function requestAurora(content) {
      const response = await fetch(endpoint + "/chat", {
        method: "POST",
        headers: {"Content-Type":"application/json","Accept":"application/json"},
        cache: "no-store",
        body: JSON.stringify({messages:[{role:"user",content}]})
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "O servidor respondeu HTTP " + response.status + ".");
      const raw = typeof data.reply === "string" ? data.reply : (typeof data.answer === "string" ? data.answer : "");
      if (!raw.trim()) throw new Error(data.error || "A API não retornou uma resposta.");
      return {data,raw,parsed:parseStructuredReply(raw)};
    }
    let result=await requestAurora(instructions);
    let {data,raw,parsed}=result;
    if(parsed&&typeof parsed==="object"){
      let actions=Array.isArray(parsed.actions)?parsed.actions:[];
      let intent=String(parsed.intent||(actions.length?"build":"chat")).toLowerCase();
      let applied=false;
      if(actions.length)applied=applySafely(actions);
      if(intent==="build"&&!applied){
        const repair=[
          "A pessoa quer materializar sua ideia no motor de jogos. A resposta anterior não produziu alterações válidas.",
          "Converta a ideia original em ações que o editor aceite. Não exija palavras-chave. Retorne SOMENTE JSON válido com intent='build', reply, actions e code.",
          "Ações 2D: create_object com object {type:rect|circle|text|star|character|sprite|platform|scenario|collision|house|tree|mountain|cloud|water|road|bridge|building,name,x,y,w,h,color,text,fontSize,animated,collision}.",
          "Ações 3D: create_3d_object com object {kind:cube|sphere|terrain|building|character|tree|camera|light|house|castle|bridge|road|water|mountain|rock|lamp|bench|fountain|portal|forest|village|city|temple|room,name,x,y,z,sx,sy,sz,rx,ry,rz,color}.",
          "Use no máximo 60 ações, com posições e dimensões visíveis. Não afirme que criou algo que não esteja nas ações.",
          "Ideia original: "+String(prompt||"").slice(0,1200),
          "Resposta anterior rejeitada: "+raw.slice(0,1200),
          "Contexto do projeto: "+JSON.stringify(project).slice(0,1200)
        ].join("\n");
        result=await requestAurora(repair);
        data=result.data;raw=result.raw;parsed=result.parsed;
        if(parsed&&typeof parsed==="object"){
          actions=Array.isArray(parsed.actions)?parsed.actions:[];
          applied=actions.length?applySafely(actions):false;
        }
      }
      if(typeof parsed?.code==="string"&&parsed.code.trim())onCode?.(parsed.code);
      let message=String(parsed?.reply||"Resposta recebida da Aurora.");
      if(applied)message+="\n\nA ideia foi materializada na cena. Use Desfazer se quiser voltar.";
      else if(intent==="build"||String(parsed?.intent||"").toLowerCase()==="build")message="Ainda não consegui materializar essa ideia: a IA não enviou ações válidas para o editor. Nenhum objeto foi adicionado.";
      else if(actions.length)message+="\n\nAs ações recebidas não puderam ser aplicadas; a cena não foi alterada.";
      if(typeof parsed?.code==="string"&&parsed.code.trim())message+="\n\nO código foi colocado no Editor de Código para você revisar antes de executar.";
      onMessage("assistant",message);
      return {...data,parsed,applied};
    }
    onMessage("assistant","A Aurora respondeu, mas não entregou um plano estruturado que o motor consiga executar. Nenhuma criação foi aplicada.\n\n"+raw);
    return {...data,parsed:null,applied:false};
  }
  return {ask,showError};
}
