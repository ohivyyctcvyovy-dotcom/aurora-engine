# Aurora Engine

Editor de criação de jogos com interface mobile-first, visual preto e dourado, cenas 2D/3D e Aurora AI integrada.

## Abrir o editor

O arquivo principal é `index.html`. Para publicar no GitHub Pages, abra **Settings → Pages → Deploy from a branch → main → /(root)**. Depois o GitHub mostrará a URL publicada na seção Pages.

## Forja — construtor de cenas

O painel Forja interpreta pedidos em linguagem natural e cria cenas em etapas, posicionando objetos 2D/3D por meio das ações permitidas pelo editor. O status aparece no painel e as alterações podem ser revertidas com **Desfazer**. Para respeitar os limites do Worker atual, cada etapa envia até 4 ações, por até 5 etapas (até 20 ações por solicitação). Cenas maiores podem ser continuadas em um novo pedido. A chave da API permanece protegida no Worker, sem ser inserida no HTML ou no navegador.

## Aurora AI — integração com a API existente

O painel Aurora AI já vem configurado por padrão para usar:

`https://aurora-api.ohivyyctcvyovy.workers.dev`

A ponte `ai/bridge.js` usa o contrato da API Aurora:
- Envia `POST /chat` com `{ message: "...", project: {...} }`, no mesmo formato que o Worker recebe.
- Recebe `{ reply: "...", actions: [...] }` e aplica as ações autorizadas no editor.
- A integração agora reconhece tanto ações 2D quanto ações 3D retornadas pelo modelo.
- O endereço pode ser alterado no campo **Endpoint da IA**; a escolha fica salva no navegador.

### O que a IA consegue fazer no editor

- Criar, editar, mover e excluir objetos 2D.
- Montar cenas 2D com formas, personagens visuais, casas, árvores, montanhas, nuvens, água, estradas, pontes e prédios procedurais.
- Usar uma biblioteca de prefabs 3D compostos: casas, castelos, pontes, estradas, água, montanhas, rochas, postes, bancos, fontes, portais, florestas, vilas, cidades, templos e interiores.
- Pedir à Aurora composições maiores com caminhos, profundidade, iluminação e pontos de interesse; prefabs compostos ajudam a criar locais ricos com menos ações.
- Criar, editar e excluir objetos 3D: cubos, esferas, terrenos, prédios, personagens visuais, árvores, câmeras e luzes.
- Analisar o resumo da cena atual para orientar as alterações.
- Gerar JavaScript e colocá-lo no **Editor de Código** para revisão.

As ações estruturadas passam por uma lista de tipos permitidos no editor. As alterações podem ser revertidas pelo botão **Desfazer**. Código gerado não é executado automaticamente: revise-o antes de tocar em **Executar código**.

### Requisitos da API

### Configuração do OmniRoute no Cloudflare Worker

O Worker usa a API OpenAI-compatível do OmniRoute em `/v1/chat/completions`. Configure no Cloudflare (Workers → Settings → Variables and Secrets):

- `OMNIROUTE_BASE_URL`: endereço da sua instância, incluindo `/v1` (ex.: `https://SEU-ENDERECO/v1`).
- `OMNIROUTE_MODEL`: ID exato do modelo exibido por `GET /v1/models`.
- `AI_ALLOWED_MODELS`: lista separada por vírgulas dos IDs de modelos que você verificou como gratuitos. O Worker recusa modelos que não estejam nessa lista.
- `OMNIROUTE_API_KEY`: crie como **Secret**, nunca como variável pública nem no HTML.

A conta/instância OmniRoute precisa estar acessível pela internet a partir do Cloudflare Worker. Um endereço local como `http://localhost:20128/v1` não funciona a partir de um Worker hospedado. O OmniRoute oferece uma API compatível com OpenAI em `/v1`; consulte a documentação oficial para confirmar o endpoint e os IDs disponíveis: https://github.com/cheaper-inference/OmniRoute/blob/main/docs/reference/OPENAI_COMPATIBILITY.md

O projeto não escolhe automaticamente um modelo pago: só permite o ID definido em `OMNIROUTE_MODEL` se ele também estiver na lista `AI_ALLOWED_MODELS`. Confirme no painel do OmniRoute que os modelos listados são gratuitos antes de adicioná-los. Cotas gratuitas podem mudar, ter limites e ficar indisponíveis; não existe garantia de uso ilimitado.

## Melhorias desta atualização\n\n- Correção do contrato entre a Forja no navegador e o Worker (`message` + `project`; resposta `reply` + `actions`).\n- Integração do Worker com OmniRoute e bloqueio de modelos que não estejam na lista explícita `AI_ALLOWED_MODELS`.\n- Ditado em português brasileiro pelo microfone e leitura em voz alta da última resposta, quando o navegador oferece Web Speech API.\n- Ajustes de renderização 3D para celulares: antialiasing e sombras reduzidos em dispositivos móveis, limite de pixel ratio e pausa do render quando a página fica em segundo plano.\n- Melhorias de acessibilidade de toque e escala de texto no celular.\n\nO reconhecimento de voz depende do navegador, da permissão do microfone e pode usar um serviço de reconhecimento remoto; não é garantido offline. A leitura em voz alta usa a síntese de voz do navegador.\n\n## Recursos do editor

- Editor 2D em Canvas e editor 3D WebGL.
- Seleção, movimentação por toque/mouse e inspetor de propriedades.
- Hierarquia, grade, criação de cenas e desfazer.
- Salvar localmente, importar e exportar projetos JSON.
- Editor de código JavaScript.
- Biblioteca de recursos e editor de lógica visual.
- Interface adaptada para celulares e computadores.

## Limites atuais

Esta é uma versão em evolução. A IA pode aplicar até 20 ações estruturadas por solicitação (4 por etapa, em até 5 etapas). Para cenas grandes, ela deve priorizar prefabs compostos e distribuí-los com posições e escalas coerentes. Recursos como execução completa de jogos exportáveis, multiplayer online, publicação Android/PC e sistemas avançados de jogo ainda exigem desenvolvimento adicional.
