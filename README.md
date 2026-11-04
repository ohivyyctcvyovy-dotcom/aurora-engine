# Aurora Engine

Editor de criação de jogos com interface mobile-first, visual preto e dourado, cenas 2D/3D e Aurora AI integrada.

## Abrir o editor

O arquivo principal é `index.html`. Para publicar no GitHub Pages, abra **Settings → Pages → Deploy from a branch → main → /(root)**. Depois o GitHub mostrará a URL publicada na seção Pages.

## Aurora AI — integração com a API existente

O painel Aurora AI já vem configurado por padrão para usar:

`https://aurora-api.ohivyyctcvyovy.workers.dev`

A ponte `ai/bridge.js` usa o contrato da API Aurora:
- Envia `POST /chat` com `{ messages: [{ role: "user", content: "..." }] }`.
- Recebe a resposta em `{ reply: "..." }`.
- Interpreta respostas JSON estruturadas para aplicar ações no editor.
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

A API precisa estar publicada e configurada com o segredo `OPENROUTER_API_KEY` no Cloudflare Worker. A chave permanece no servidor, nunca no HTML ou no navegador. O Worker deve permitir a origem `https://ohivyyctcvyovy-dotcom.github.io` e responder à rota `POST /chat` no formato descrito acima.

A API gratuita pode ter limites de uso e disponibilidade do modelo. Não há garantia de uso ilimitado.

## Recursos do editor

- Editor 2D em Canvas e editor 3D WebGL.
- Seleção, movimentação por toque/mouse e inspetor de propriedades.
- Hierarquia, grade, criação de cenas e desfazer.
- Salvar localmente, importar e exportar projetos JSON.
- Editor de código JavaScript.
- Biblioteca de recursos e editor de lógica visual.
- Interface adaptada para celulares e computadores.

## Limites atuais

Esta é uma versão em evolução. A IA pode aplicar até 12 ações estruturadas por resposta. Para cenas grandes, ela deve priorizar prefabs compostos e distribuí-los com posições e escalas coerentes. Recursos como execução completa de jogos exportáveis, multiplayer online, publicação Android/PC e sistemas avançados de jogo ainda exigem desenvolvimento adicional.
