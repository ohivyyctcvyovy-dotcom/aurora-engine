# Aurora Engine

Motor de criação de jogos 2D e 3D, com editor visual mobile-first e **IA integrada desde o início**.

## Protótipo inicial
- Editor 2D em Canvas: criar, selecionar e mover formas e textos.
- Hierarquia e inspetor de propriedades.
- Executar/parar prévia.
- Salvar no navegador e importar/exportar projeto JSON.
- Painel Aurora AI dentro do editor.
- Camada AI Bridge com contexto do projeto, ferramentas e endpoint configurável.
- Backend Worker de exemplo para conectar um provedor de IA sem expor a chave no navegador.

## Abrir
Publique a raiz do repositório com GitHub Pages e abra `index.html`.

## Conectar a IA
Configure um endpoint HTTPS compatível com o contrato em `ai/bridge.js`. Para desenvolvimento com OpenRouter, use o Worker em `worker/src/index.js` e configure o segredo `OPENROUTER_API_KEY` no ambiente do Worker. Nunca coloque chaves secretas no HTML ou no repositório.

## Acesso da IA
A ponte permite ler o resumo do projeto e solicitar operações de edição/teste. As operações são limitadas ao workspace do motor, registradas e podem ser desfeitas. Acesso total ao celular, contas externas ou ações destrutivas sem recuperação não fazem parte do escopo.

## Próximas etapas
1. Completar o sistema de cenas e ferramentas 2D.
2. Integrar renderização 3D.
3. Adicionar execução de scripts em ambiente isolado e testes automatizados.
4. Implementar exportação web e, depois, empacotamento Android/PC.
5. Evoluir o AI Bridge para operações de editor com histórico e desfazer.
