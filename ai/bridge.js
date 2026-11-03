// Aurora AI Bridge — interface segura entre o modelo e as ferramentas locais do editor.
export function createAIClient({getEndpoint,getProject,onMessage,applyActions}) {
  function showError(message){onMessage('assistant','Não consegui conectar à IA: '+message+'\nConfira o endpoint e o Worker.');}
  async function ask(prompt){
    const endpoint=getEndpoint();
    if(!endpoint) throw new Error('Configure o endereço HTTPS do Worker no campo Endpoint da IA.');
    onMessage('user',prompt);
    const response=await fetch(endpoint.replace(/\/$/,'')+'/chat',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({message:prompt,project:getProject(),client:'aurora-engine',tools:['create_object','update_object','delete_object']})
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(data.error||'O servidor respondeu HTTP '+response.status+'.');
    if(Array.isArray(data.actions)&&data.actions.length){
      const applied=applyActions?.(data.actions);
      onMessage('assistant',(data.reply||'Alterações preparadas.')+(applied?'\n\nAs alterações foram aplicadas à cena. Use Desfazer se quiser voltar.':'\n\nNão havia alterações válidas para aplicar.'));
    }else onMessage('assistant',data.reply||'A IA respondeu sem texto.');
    return data;
  }
  return {ask,showError};
}
