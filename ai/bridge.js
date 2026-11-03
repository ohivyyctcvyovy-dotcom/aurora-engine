// Aurora AI Bridge — frontend client. The provider key must remain on the server.
export function createAIClient({getEndpoint,getProject,onMessage}) {
  function showError(message){onMessage('assistant','Não consegui conectar à IA: '+message+'\nVerifique o endpoint e o serviço backend.');}
  async function ask(prompt){
    const endpoint=getEndpoint();
    if(!endpoint) throw new Error('Configure o endpoint HTTPS do serviço Aurora AI no campo Endpoint da IA.');
    onMessage('user',prompt);
    const response=await fetch(endpoint.replace(/\/$/,'')+'/chat',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({message:prompt,project:getProject(),client:'aurora-engine'})
    });
    if(!response.ok) throw new Error('O servidor respondeu HTTP '+response.status+'.');
    const data=await response.json();
    onMessage('assistant',data.reply||'O servidor respondeu, mas não enviou o campo reply.');
    return data;
  }
  return {ask,showError};
}
