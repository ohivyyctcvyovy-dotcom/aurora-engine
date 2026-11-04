// Aurora AI Bridge — conecta o editor à API já existente da Aurora.
function compactProject(project) {
  const p = project || {};
  return {
    name: p.name || "Meu jogo",
    mode: p.mode || "2D",
    width: p.width || 1280,
    height: p.height || 720,
    objects: (Array.isArray(p.objects) ? p.objects : []).slice(0, 12).map(o => ({
      id:o.id,type:o.type,name:o.name,x:o.x,y:o.y,w:o.w,h:o.h,color:o.color,
      text:o.text,animated:!!o.animated,collision:!!o.collision
    })),
    objects3d: (Array.isArray(p.objects3d) ? p.objects3d : []).slice(0, 10).map(o => ({
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
      "Você é Aurora AI integrada ao editor Aurora Engine. Responda em português brasileiro.",
      "Sua tarefa é ajudar a construir cenas e projetos de jogos no editor, usando ações estruturadas.",
      "Retorne SOMENTE JSON válido, sem Markdown, neste formato: {\"reply\":\"resumo curto\",\"actions\":[],\"code\":\"\"}.",
      "Ações 2D: create_object com object {type:rect|circle|text|star|character|sprite|platform|scenario|collision|house|tree|mountain|cloud|water|road|bridge|building,name,x,y,w,h,color,text,fontSize,animated,collision}.",
      "Também pode usar update_object com name e changes, delete_object com name, ou replace_scene com name e objects (somente se o usuário pedir para substituir a cena).",
      "Ações 3D: create_3d_object com object {kind:cube|sphere|terrain|building|character|tree|camera|light|house|castle|bridge|road|water|mountain|rock|lamp|bench|fountain|portal|forest|village|city|temple|room,name,x,y,z,sx,sy,sz,rx,ry,rz,color}. Prefira prefabs compostos como village, city, castle, temple, forest e room para criar lugares ricos com poucas ações.",
      "Use coordenadas 2D entre 0 e 1280 (X) e 0 e 720 (Y). Em 3D, use posições e escalas moderadas.",
      "Crie cenas elaboradas com composição, profundidade, camadas, iluminação, caminhos e pontos de interesse. Use prefabs compostos para cidades, vilas, castelos, templos, florestas, interiores e pontes; organize os elementos com escala e espaçamento coerentes. Crie ambientes, prédios, salas, corredores, cenários, personagens visuais, árvores, decoração, interfaces e lógica genérica. Não crie armas nem instruções de combate.",
      "No máximo 12 ações por resposta. Não apague a cena existente, a menos que o usuário peça claramente para substituí-la.",
      "Se o usuário pedir código JavaScript, coloque o código no campo code como texto. Nunca afirme que executou o código; ele será apenas colocado no editor para revisão.",
      "Contexto resumido do projeto: " + JSON.stringify(project).slice(0, 600),
      "Pedido do usuário: " + String(prompt || "").slice(0, 800)
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
