# Aurora Engine

Editor de criação de jogos com interface adaptada para Android, cenas 2D/3D e Aurora AI.

## Publicação

O arquivo principal é `index.html`. No GitHub, configure **Settings → Pages → Deploy from a branch → main → /(root)**.

## Aurora AI / Forja

A Forja envia o pedido e um resumo da cena ao Worker. Ela pode:
- Criar, mover, alterar e excluir objetos 2D e 3D dos tipos reconhecidos pelo motor.
- Criar cenas com prefabs procedurais e distribuir novos objetos em espaços livres quando a posição não é especificada.
- Criar pisos 3D por grade (por exemplo, 5×5) e paredes com lados `north`, `south`, `east` e `west`, alinhadas às bordas do piso.
- Gerar JavaScript para a API Aurora e colocá-lo no Editor de Código.

A IA não é um gerador irrestrito de qualquer sistema: ações de cena precisam usar tipos reconhecidos pelo editor; scripts precisam usar a API que o motor oferece. Recursos ou mecânicas novas exigem implementação no motor.

## Scripts

Quando você pedir um script, a IA deve devolver código no campo de código e abrir o Editor de Código. Revise e toque em **Executar código** para testar. Se houver erro de JavaScript, o Editor de Código mostra a mensagem.

API atualmente oferecida:

- `aurora.criar(tipo, x, y)`
- `aurora.cor(id, "#RRGGBB")`
- `aurora.personagem(x, y, cor)`
- `aurora.plataforma(x, y, largura, altura, cor)`
- `aurora.texto(texto, x, y, cor, tamanho)`
- `aurora.cenario(cor)`
- `aurora.item(x, y, cor)`
- `aurora.criar3D(tipo, x, y, z)`
- `aurora.criarChao3D(tilesX, tilesZ, x, z)`
- `aurora.criarParede3D(lado, comprimento, altura, x, z)`
- `aurora.mover3D(id, x, y, z)`
- `aurora.escala3D(id, x, y, z)`
- `aurora.girar3D(id, x, y, z)`
- `aurora.cor3D(id, cor)`
- `aurora.nomear(id, nome)`
- `aurora.limparCena()`

**Segurança:** a execução atual usa o contexto da página do editor, não um ambiente isolado. Execute somente scripts que você confia e revise o conteúdo antes de executar. O código não é executado automaticamente ao ser gerado.

## Play / testar

O modo Play desativa a seleção e a órbita da câmera do editor. O joystick controla o personagem; a câmera de edição não deve receber os toques de jogo. Para testar, a cena precisa ter um objeto do tipo personagem (2D/3D) ou sprite. O motor não deve mover o primeiro objeto do cenário como substituto de personagem.

O Play atual é uma prévia de teste das funções suportadas, não um compilador completo de jogos exportáveis.

## Posicionamento 2D e 3D

- Em 2D, quando a IA não recebe uma posição definida, o editor procura uma área livre em vez de empilhar tudo no centro.
- Em 3D, quando a IA não recebe X/Z, o editor procura um ponto livre no piso.
- Um piso 5×5 usa cinco quadrados de 100 unidades em cada direção.
- Paredes 3D usam o lado do piso e dimensões reais para encostar nas bordas. Para uma sala fechada, a IA deve criar paredes nos quatro lados.

## Enviar seus próprios recursos

Na **Biblioteca de Recursos**, use **Enviar meus arquivos**. Formatos aceitos:
- Modelos 3D: `.glb` (até 40 MB por arquivo).
- Texturas: `.png`, `.jpg`, `.jpeg`, `.webp` (aplicadas ao objeto 3D selecionado).
- Áudio: `.mp3`, `.wav`, `.ogg`.

Você pode selecionar vários arquivos do pack de uma vez. Os arquivos são guardados no armazenamento local do navegador (IndexedDB) e permanecem neste dispositivo/navegador. O JSON exportado do projeto guarda as referências, mas não incorpora os arquivos binários; mantenha os arquivos originais. Arquivos ZIP e modelos glTF com dependências externas não são importados diretamente; prefira GLB.

## Recursos inspirados na Godot

A Aurora está evoluindo com conceitos de árvore de cena, inspetor, cenas reutilizáveis, recursos, sinais, física, animação e depuração. O mapa técnico, o que já existe e as próximas etapas estão em [GODOT-ROADMAP.md](./GODOT-ROADMAP.md). A árvore atual ainda é uma lista plana; o sistema pai/filho e as cenas reutilizáveis são etapas futuras.

## Seleção de modelos de IA

O painel da Forja tem uma lista de modelos autorizados. Toque em **Atualizar modelos disponíveis** para consultar o catálogo pelo Worker. O navegador nunca recebe a chave do OmniRoute. O Worker mostra somente os IDs definidos em `AI_ALLOWED_MODELS` e aceita no chat apenas um desses IDs. A opção vazia usa `OMNIROUTE_MODEL`. Inclua nessa lista somente modelos cuja condição de uso e gratuidade você confirmou no seu OmniRoute.

## OmniRoute

O Worker usa a API compatível com OpenAI do OmniRoute em `/v1/chat/completions`. Configure no Cloudflare Worker:

- `OMNIROUTE_BASE_URL`: URL pública da instância, incluindo `/v1`.
- `OMNIROUTE_MODEL`: ID exato do modelo.
- `AI_ALLOWED_MODELS`: lista separada por vírgulas dos IDs que foram confirmados como gratuitos.
- `OMNIROUTE_API_KEY`: segredo do Worker, nunca no HTML.

O Worker recusa modelos que não estejam em `AI_ALLOWED_MODELS`. Confirme no OmniRoute quais modelos são gratuitos; cotas podem mudar e não são ilimitadas.

## Limitações conhecidas

- A execução de scripts ainda não está isolada em sandbox.
- A prévia Play oferece controles e lógica básica, não todos os sistemas de um motor profissional.
- GLB é o formato recomendado para modelos 3D; ZIP não é extraído pelo editor.
- Recursos enviados ficam no armazenamento local do navegador e não são embutidos no JSON exportado.
- Mecânicas personalizadas além da API Aurora precisam ser implementadas no motor.
