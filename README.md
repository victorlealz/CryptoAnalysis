# GuiaCrypto144

Guia web estático para apoio a investigações de **Chain Analysis**, com foco em Bitcoin/UTXO, Ethereum e redes EVM, TRON, DeFi, bridges/cross-chain, atribuição OSINT e identificação de possíveis VASPs/PSAVs.

> **Política do projeto:** somente fontes abertas e dados públicos. O frontend não contém chaves, tokens, credenciais nem consultas a APIs privadas.

## Estrutura

```text
/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── main.js
├── assets/
│   ├── images/
│   │   └── chain-flow.svg
│   └── icons/
│       └── favicon.svg
├── knowledge/
│   ├── sources.json
│   ├── SKILL.md
│   └── knowledge-base.md
├── package.json
├── wrangler.jsonc
├── _headers
├── .gitignore
└── README.md
```

- `index.html`: interface semântica do guia.
- `css/style.css`: estilos responsivos e acessíveis.
- `js/main.js`: triagem, roteiros, caderno de rastreio, exportação e leitor das bases Markdown.
- `assets/`: ícone e ilustração local; nenhum recurso visual externo é obrigatório.
- `knowledge/`: arquivos metodológicos carregados dinamicamente pelo navegador.
- `knowledge/sources.json`: manifesto que desacopla a interface dos arquivos de conhecimento.
- `_headers`: cabeçalhos de segurança para Cloudflare Pages.

## Knowledge Base e SKILL.md

O site **não copia o conteúdo das bases para o JavaScript**. Ele carrega os arquivos Markdown em tempo de execução por meio do manifesto `knowledge/sources.json`.

Isso permite atualizar `knowledge-base.md` e `SKILL.md` sem alterar a aplicação. O renderizador trata os documentos como Markdown genérico e não depende de títulos ou números de seção específicos.

### Atualizar uma base existente

Substitua o conteúdo do arquivo mantendo o mesmo caminho:

```text
knowledge/knowledge-base.md
knowledge/SKILL.md
```

Nenhuma mudança no JavaScript é necessária.

### Renomear ou adicionar bases

Edite apenas `knowledge/sources.json`:

```json
{
  "schemaVersion": 1,
  "sources": [
    {
      "id": "knowledge-base",
      "label": "Knowledge Base",
      "path": "./knowledge/knowledge-base.md",
      "description": "Base metodológica."
    }
  ]
}
```

Campos adicionais no manifesto são ignorados pelo frontend. Se uma fonte falhar, as demais continuam sendo carregadas e a interface principal permanece funcional.

## Desenvolvimento local

Pré-requisito: uma versão do Node.js suportada pelo Wrangler.

```bash
npm install
npm run dev
```

O Wrangler iniciará um servidor local para o site estático. Use a URL exibida no terminal.

Evite abrir `index.html` diretamente com `file://`, porque navegadores normalmente bloqueiam o `fetch()` dos arquivos Markdown locais. Use `npm run dev` ou outro servidor HTTP estático.

## Deploy

### GitHub → Cloudflare Pages

1. Crie um repositório GitHub e envie este projeto.
2. No Cloudflare Dashboard, abra **Workers & Pages** e crie um projeto **Pages** conectado ao GitHub.
3. Selecione o repositório.
4. Use:
   - **Production branch:** `main`
   - **Framework preset:** nenhum
   - **Build command:** deixe em branco; se o painel exigir um comando, use `exit 0`
   - **Build output directory:** `.`
   - **Root directory:** raiz do repositório
5. Salve e faça o deploy.

Como o projeto é HTML/CSS/JavaScript puro, não existe etapa de compilação.

### Deploy manual com Wrangler

O projeto usa Wrangler `4.135.0` como dependência de desenvolvimento.

```bash
npm install
npm run deploy
```

O comando publica o diretório atual no projeto Pages `guiacrypto144`. O Wrangler solicitará autenticação quando necessário; nenhuma credencial deve ser adicionada ao repositório.

## Cloudflare Pages

`wrangler.jsonc` contém somente configuração pública:

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "guiacrypto144",
  "pages_build_output_dir": ".",
  "compatibility_date": "2026-09-23"
}
```

Não há Pages Functions, D1, KV, R2, Workers AI ou secrets neste projeto.

O arquivo `_headers` aplica políticas de segurança compatíveis com a aplicação estática, incluindo CSP, proteção contra framing, política de referência e bloqueio de permissões de navegador não utilizadas.

## Variáveis de ambiente

Nenhuma variável de ambiente é necessária.

Não crie ou versione arquivos `.env` com credenciais. O `.gitignore` já exclui `.env`, `.env.*`, `.dev.vars`, `.wrangler/` e `node_modules/`.

## Funcionalidades

- triagem sintática de endereços e hashes para Bitcoin, EVM e TRON;
- atalhos para exploradores públicos da rede selecionada;
- roteiros de investigação por modelo de blockchain;
- lembretes de heurísticas e limitações;
- caderno de rastreio em memória, sem envio de dados;
- exportação local da tabela de saltos em CSV e JSON;
- modelos de redação técnica copiáveis;
- leitor local de Knowledge Base e SKILL.md;
- busca textual nas bases carregadas;
- suporte a novas fontes Markdown pelo manifesto, sem alteração do código principal.

## Segurança e privacidade

O GuiaCrypto144 é uma aplicação estática. Por padrão:

- não envia o conteúdo do caderno para nenhum servidor;
- não persiste a tabela de saltos em `localStorage`;
- não usa cookies;
- não usa analytics;
- não usa bibliotecas externas no navegador;
- não contém API keys, tokens ou segredos;
- não conecta carteiras;
- não assina mensagens ou transações.

Ainda assim, o usuário deve evitar inserir dados sigilosos em fontes públicas externas. Trabalhe preferencialmente com identificadores on-chain públicos e preserve a cadeia de documentação da investigação.

## Git

Exemplo de inicialização:

```bash
git init
git add .
git commit -m "Initial commit: GuiaCrypto144"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/GuiaCrypto144.git
git push -u origin main
```

## Manutenção

A interface e as bases são deliberadamente separadas:

- mudanças metodológicas ficam em `knowledge/*.md`;
- inclusão/remoção de fontes fica em `knowledge/sources.json`;
- comportamento da interface fica em `js/main.js`;
- apresentação fica em `css/style.css`.

Essa separação reduz o acoplamento e permite atualizar o conhecimento sem reescrever a aplicação.
