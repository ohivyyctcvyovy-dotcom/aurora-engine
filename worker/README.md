# Aurora AI Worker

Backend opcional para conectar o painel Aurora AI ao OpenRouter.

1. Crie um Cloudflare Worker usando `src/index.js`.
2. Configure o segredo `OPENROUTER_API_KEY` no painel/CLI do Cloudflare.
3. Opcionalmente configure `OPENROUTER_MODEL`.
4. Copie a URL HTTPS do Worker e cole em **Endpoint da IA** no editor.

O segredo nunca deve ser adicionado ao repositório nem ao navegador. O endpoint de exemplo usa CORS aberto para facilitar o primeiro teste; antes de uso público, restrinja a origem ao domínio do editor e implemente autenticação/limites de uso.
