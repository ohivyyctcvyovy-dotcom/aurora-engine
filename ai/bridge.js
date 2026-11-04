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
      "Entenda pedidos em linguagem natural como instruções de construção. Identifique modo 2D/3D pelo projeto atual, a menos que o usuário peça outro modo.",
      "Antes de gerar ações, interprete: objetivo, dimensões/unidades, quantidade de elementos, posições relativas, conexões, aparência e interações pedidas. Transforme medidas como grade 5x5 em layout regular, com espaçamento uniforme e limites claros.",
      "Planeje a cena como um conjunto coerente: alinhe objetos, mantenha escala consistente, evite sobreposições, deixe passagens livres e conecte caminhos, salas, corredores e entradas. Use coordenadas calculadas; não espalhe objetos aleatoriamente nem use posições enormes sem necessidade.",
      "Para pedidos 2D, pense como designer de fases: organize camadas (fundo, cenário, piso/plataformas, obstáculos, objetos, personagens e textos), use 1280x720 como referência, distribua elementos com proporções e espaçamento consistentes e não coloque tudo no centro. Em mapas, use linhas e colunas regulares; em interiores, mantenha corredores e vãos livres; em paisagens, combine fundo, terreno e elementos em planos distintos.",
      "Interprete pedidos variados, não apenas mapas: menus, telas iniciais, vilas, cidades, florestas, interiores, plataformas, fases de aventura, cenários de corrida, objetos decorativos, personagens e interfaces. Extraia cada elemento, quantidade, tamanho aproximado, estilo e posição relativa. Se o pedido for amplo, monte uma composição coerente em vez de criar apenas um objeto genérico.",
      "No 2D, escolha tipos conforme a função visual: rect para formas/estruturas, platform para pisos, scenario para fundo, character/sprite para personagens, text para rótulos e prefabs house/tree/mountain/cloud/water/road/bridge/building quando adequados. Varie largura e altura conforme o objeto; não use o mesmo tamanho para tudo.",
      "Se o pedido descrever salas, mapa ou edifício, construa a planta de forma lógica: piso, paredes externas, divisórias, vãos de passagem e portas representadas por objetos. Se pedir uma quantidade exata, respeite-a. Não diga que uma porta ou comportamento é funcional se o editor só criar a representação visual.",
      "Seja fiel ao pedido e ao contexto da cena. Preserve os objetos existentes; acrescente ou atualize apenas o necessário. Só substitua ou apague a cena quando isso for solicitado explicitamente. Se faltar um detalhe não essencial, escolha uma solução sensata e informe brevemente a escolha.",
      "Use as ações estruturadas suportadas pelo editor. Retorne SOMENTE JSON válido, sem Markdown: {\"reply\":\"resumo curto\",\"actions\":[],\"code\":\"\"}. Não invente tipos ou campos que não estejam listados.",
      "Ações 2D: create_object com object {type:rect|circle|text|star|character|sprite|platform|scenario|collision|house|tree|mountain|cloud|water|road|bridge|building,name,x,y,w,h,color,text,fontSize,animated,collision}. Também update_object com name e changes, delete_object com name, replace_scene com objects apenas se o usuário pedir substituição.",
      "Ações 3D: create_3d_object com object {kind:cube|sphere|terrain|building|character|tree|camera|light|house|castle|bridge|road|water|mountain|rock|lamp|bench|fountain|portal|forest|village|city|temple|room,name,x,y,z,sx,sy,sz,rx,ry,rz,color}. Também update_3d_object e delete_3d_object com name. Prefabs compostos economizam ações, mas use vários objetos quando o pedido exigir partes separadas.",
      "O editor aceita até 30 ações por resposta. Use o limite com inteligência para montar cenas compostas; agrupe detalhes em prefabs quando possível. Se o pedido exceder a capacidade, priorize a estrutura principal e explique claramente o que ficou pendente.",
      "Personagens podem ter aparência, posição e escala. Para interações não violentas, descreva lógica genérica apenas quando suportada; não afirme que comportamentos foram instalados se só criou objetos. Não crie armas nem instruções de combate.",
      "Só preencha code quando o usuário pedir código ou uma lógica que o editor não consegue representar por ações; esse código é inserido para revisão e não é executado automaticamente.",
      "Contexto do projeto atual: " + JSON.stringify(project).slice(0, 600),
      "Pedido completo do usuário: " + String(prompt || "").slice(0, 900)
    ].join("\n");
    onMessage("user", prompt);
    const response = await fetch(endpoint + "/chat", {
      method: "POST",
      headers: {"Content-Type":"application/json","Accept":"application/json"},
      cache: "no-store",
      body: JSON.stringify({messages:[{role:"user",content:instructions}]})
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "O servidor respondeu HTTP " + response.status + ".");
    const raw = typeof data.reply === "string" ? data.reply :
      (typeof data.answer === "string" ? data.answer : "");
    if (!raw.trim()) throw new Error(data.error || "A API não retornou uma resposta.");
    const parsed = parseStructuredReply(raw);
    if (parsed && typeof parsed === "object") {
      const actions = Array.isArray(parsed.actions) ? parsed.actions : [];
      let applied = false;
      if (actions.length) applied = !!applyActions?.(actions);
      if (typeof parsed.code === "string" && parsed.code.trim()) onCode?.(parsed.code);
      let message = String(parsed.reply || "Resposta recebida da Aurora.");
      if (applied) message += "\n\nAs alterações foram aplicadas à cena. Use Desfazer se quiser voltar.";
      else if (actions.length) message += "\n\nA resposta continha ações, mas nenhuma alteração válida foi aplicada.";
      if (typeof parsed.code === "string" && parsed.code.trim()) message += "\n\nO código foi colocado no Editor de Código para você revisar antes de executar.";
      onMessage("assistant", message);
      return {...data, parsed};
    }
    onMessage("assistant", raw);
    return data;
  }
  return {ask,showError};
}
