# Aurora Engine

Editor de criação de jogos com interface mobile-first, visual preto e dourado e Aurora AI integrada.

## Abrir o editor
O arquivo principal é `index.html`. Para ter um endereço de site, ative **Settings → Pages → Deploy from a branch → main → /(root)** no GitHub. Depois o GitHub mostrará a URL publicada na seção Pages. A publicação pode levar alguns minutos.

## O que já funciona nesta versão
- Editor 2D em Canvas com retângulo, círculo, estrela e texto.
- Seleção, movimentação por toque/mouse e inspetor de propriedades.
- Hierarquia, grade, exclusão e criação de cena.
- Desfazer com o botão ou Ctrl+Z.
- Salvar localmente, importar e exportar JSON.
- Painel Aurora AI dentro do editor.
- AI Bridge envia o contexto da cena ao Worker.
- A IA pode criar, editar e excluir objetos por ações limitadas e validadas no próprio editor.

## Ativar a IA
1. Publique o Worker da pasta `worker` no Cloudflare.
2. Configure o segredo `OPENROUTER_API_KEY` no Worker e, se necessário, `OPENROUTER_MODEL`.
3. Copie a URL HTTPS do Worker.
4. Abra o editor, toque em **Aurora AI**, cole a URL no campo **Endpoint da IA** e envie um pedido como: “Crie um círculo azul e um título dourado no centro”.

A chave fica no Worker, nunca no HTML. O provedor/modelo pode ter limites ou custos; confira as condições antes de usar. O modo IA não é ativado até o Worker estar publicado e configurado.

## Limites atuais
Esta é uma versão inicial do editor 2D. O modo 3D, execução real de jogos, scripts, exportação Android/PC e ferramentas avançadas ainda precisam ser construídos. A IA só pode executar as três ações de objetos descritas acima; não tem acesso ao celular nem a contas externas.
