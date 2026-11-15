# Plano técnico: Aurora Engine inspirada na Godot

Este documento descreve como aproximar a Aurora Engine da experiência de criação da Godot sem copiar o código ou prometer equivalência com uma engine nativa. A Aurora continua sendo uma aplicação web, com foco em Android e execução no navegador.

## 1. Como a Godot organiza uma engine

### Cenas, nós e árvore de cena
- Um projeto é composto por cenas reutilizáveis.
- Cada cena tem um nó raiz e uma árvore de nós filhos.
- Nós têm nome, propriedades editáveis, ciclo de atualização e podem ser estendidos.
- Uma cena salva pode ser instanciada várias vezes dentro de outra cena.
- Sinais permitem que nós reajam a eventos sem ficarem diretamente acoplados.

**Equivalente planejado na Aurora:** árvore hierárquica real com pai/filho, cenas reutilizáveis, instanciar/duplicar, grupos e conexões de eventos. A lista atual de objetos é apenas uma hierarquia visual plana; ainda não implementa parentesco entre nós.

### Editor integrado
A experiência da Godot reúne:
- Viewport 2D e viewport 3D;
- painel de Cena (árvore de nós);
- Inspetor (propriedades do nó selecionado);
- painel de Sistema de Arquivos/recursos;
- editor de scripts com referência e autocompletar;
- depurador e console;
- editor de animação;
- editor de TileMap;
- editor de shaders;
- profiler e monitores de desempenho;
- tela de execução/teste e biblioteca de assets.

**Equivalente atual na Aurora:** viewport 2D/3D, lista de objetos, inspetor básico, biblioteca local, editor JavaScript simples, prévia Play e IA. O inspetor e a árvore ainda não têm toda a semântica de nós/cenas da Godot.

### Scripts e ciclo de vida
A Godot oferece GDScript e C#, além de extensões em C/C++. Scripts podem reagir ao ciclo de vida do nó, ao processamento por frame/física, a sinais, a grupos e à troca de cenas.

**Equivalente planejado na Aurora:** API de scripts estável com eventos explícitos (início, atualização, física, colisão, entrada e saída), componentes de comportamento, documentação contextual e erros apresentados no editor. A Aurora hoje gera JavaScript para uma API própria; não executa GDScript nem C#.

### Recursos e importação
Na Godot, cenas também são recursos; o editor importa arquivos, mantém referências, permite reuso e organiza os recursos no projeto.

**Equivalente atual na Aurora:** upload local de GLB, imagens e áudio. Os arquivos ficam no IndexedDB do navegador. O projeto JSON guarda referências, mas não empacota os binários. ZIP e glTF com dependências externas não são importados diretamente.

### Sistemas de jogo
Para se aproximar de uma engine geral, a Aurora precisa evoluir além de colocar primitivas na cena:
1. sistema de entrada configurável (ações como mover, pular, interagir);
2. corpos físicos 2D/3D, colisões e áreas;
3. animação por trilhas, estados e transições;
4. sinais/eventos e grupos;
5. câmeras, luzes e materiais configuráveis;
6. navegação e pathfinding;
7. UI responsiva e âncoras;
8. áudio por buses/volumes;
9. cenas e prefabs reutilizáveis;
10. depuração, logs, pausa e passo-a-passo;
11. exportação/build e empacotamento de recursos.

Esses sistemas não aparecem automaticamente só porque a IA gerou código: precisam existir no runtime da Aurora e ter uma API definida.

## 2. Mapeamento de recursos

| Área da Godot | Aurora hoje | Evolução necessária |
|---|---|---|
| Cena / árvore de nós | Lista plana de objetos | Nós pai/filho, raiz, instâncias de cena |
| Inspetor | Transformações e algumas propriedades | Tipos de propriedade, validação, recursos e edição em lote |
| Viewport 2D/3D | Existe | Seleção consistente, snapping, gizmos e ferramentas de edição |
| Recursos | Upload GLB/imagem/áudio local | Importador, miniaturas, metadados, reimportação e empacotamento |
| Scripts | JavaScript via API Aurora | Eventos, módulos, autocompletar, diagnóstico e isolamento |
| Física | Colisão/hitbox simples | Física 2D/3D real, corpos, áreas e consultas |
| Animação | Flags/efeitos básicos | Timeline, keyframes, AnimationPlayer e máquina de estados |
| Sinais | Não há sistema geral | Conectar/desconectar eventos entre nós |
| TileMap | Não há editor completo | Grade, tilesets, camadas e colisões |
| Debugger/profiler | Mensagens simples | Console, breakpoints possíveis, métricas CPU/GPU e monitor |
| Exportação | JSON do projeto | Pacote de projeto com assets e runtime exportável |

## 3. Plano de implementação por fases

### Fase A — Fundamentos do editor
- Árvore de cena unificada para 2D e 3D.
- Pai/filho, renomear, duplicar, ocultar, bloquear e excluir nós.
- Inspetor por tipo de nó.
- Salvar/restaurar hierarquia e seleção.
- Undo/redo consistente para ações do editor.

### Fase B — Sistema de cenas e recursos
- Criar, salvar, renomear e instanciar cenas.
- Prefabs reutilizáveis com parâmetros.
- Biblioteca de recursos com preview, metadados e referências persistentes.
- Exportação que inclua os recursos, não apenas caminhos/IDs.

### Fase C — Programação de gameplay
- Mapa de ações de entrada.
- API de eventos e sinais.
- Componentes de personagem, câmera, colisão e interação.
- Runtime de física e atualização em passo fixo.
- Templates de scripts e exemplos testáveis.

### Fase D — Animação e depuração
- Timeline e keyframes.
- Animação de propriedades e estados.
- Console com erros por script/objeto.
- Pausar, continuar e avançar quadro.
- Monitores de FPS, memória e tempo de atualização.

### Fase E — Ferramentas avançadas
- TileMap 2D e ferramentas de terreno 3D.
- Materiais/shaders.
- Navegação e pathfinding.
- Áudio com mixer.
- Exportação e otimização de projetos.

## 4. IA da Aurora

A IA deve trabalhar com três operações distintas:
1. **Entender:** ler resumo do projeto, árvore, recursos e configurações.
2. **Planejar:** produzir um plano de alterações e explicar o que vai mudar.
3. **Executar:** chamar ações estruturadas suportadas pelo motor ou gerar um script compatível com a API Aurora.

A IA não deve inventar funções que o motor não implementa. Se uma mecânica não existir, ela deve dizer que falta implementar o recurso ou criar um script usando apenas APIs disponíveis.

### Seleção de modelos OmniRoute
O editor agora pode solicitar ao Worker a lista de modelos configurados e escolher um deles. O Worker:
- consulta `GET /v1/models` no OmniRoute usando a chave guardada no servidor;
- mostra somente IDs incluídos em `AI_ALLOWED_MODELS`;
- aceita no chat apenas um modelo presente nessa lista;
- usa `OMNIROUTE_MODEL` como padrão quando o usuário escolhe a opção padrão.

A lista permitida deve conter apenas modelos que o responsável pela configuração confirmou como adequados e gratuitos. A API de catálogo não garante, por si só, que um modelo seja gratuito ou tenha cota ilimitada. Nunca coloque a chave OmniRoute no HTML ou no navegador.

## 5. Limites reais do navegador e do Android
- O navegador precisa respeitar memória, GPU, armazenamento e limites de execução do aparelho.
- Projetos 3D pesados devem ter níveis de detalhe, texturas comprimidas, limites de luzes e carregamento sob demanda.
- A execução de scripts precisa ser isolada antes de aceitar código não confiável. A execução atual da Aurora não é um sandbox seguro.
- A Aurora não se torna a Godot nem executa projetos Godot nativamente. O objetivo é oferecer conceitos e fluxos de trabalho semelhantes em uma engine web mais leve.

## Referências oficiais consultadas
- Godot: visão geral de conceitos — https://docs.godotengine.org/en/4.4/getting_started/introduction/key_concepts_overview.html
- Godot: nós e cenas — https://docs.godotengine.org/en/latest/getting_started/step_by_step/nodes_and_scenes.html
- Godot: visão geral do editor — https://docs.godotengine.org/en/stable/getting_started/introduction/first_look_at_the_editor.html
- Godot: recursos e instâncias de cenas — https://docs.godotengine.org/en/latest/tutorials/scripting/resources.html
- Godot: scripting — https://docs.godotengine.org/en/4.5/tutorials/scripting/index.html
- OmniRoute: compatibilidade OpenAI e catálogo de modelos — https://github.com/kodozai/OmniRoute/blob/main/docs/reference/OPENAI_COMPATIBILITY.md
