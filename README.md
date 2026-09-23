# GuiaCrypto144

> **SOMENTE FONTES ABERTAS — OSINT / DADOS PÚBLICOS**

Guia operacional interno para apoio a policiais e analistas em tarefas de Chain Analysis. O projeto é propositalmente simples: HTML, CSS e JavaScript puro, sem backend, banco de dados ou bibliotecas de frontend.

## Objetivo

- orientar a leitura inicial de Bitcoin/UTXO, Ethereum/EVM e TRON;
- registrar saltos de forma reproduzível;
- separar observado, inferido, confirmado publicamente e limitação;
- manter uma consulta local à `knowledge-base.md` e ao `SKILL.md` anexados ao repositório;
- evitar transformar heurística ou rótulo público em identificação civil.

O site não consulta APIs de blockchain. Os dados on-chain devem ser conferidos manualmente nos exploradores públicos adequados.

## Estrutura

```text
/
├── public/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── main.js
│   ├── assets/
│   │   └── icons/
│   │       └── favicon.svg
│   ├── knowledge/
│   │   ├── sources.json
│   │   ├── SKILL.md
│   │   └── knowledge-base.md
│   └── _headers
├── package.json
├── wrangler.jsonc
├── .gitignore
└── README.md
```

## Bases de conhecimento

A interface não depende da estrutura interna dos arquivos Markdown. Ela lê `public/knowledge/sources.json` e realiza pesquisa textual nos arquivos listados ali.

Assim, atualizações futuras em `SKILL.md` e `knowledge-base.md` não exigem alteração no JavaScript, desde que os arquivos continuem sendo texto/Markdown e os caminhos do manifesto sejam preservados.

Para adicionar outra base:

1. coloque o arquivo em `public/knowledge/`;
2. acrescente uma entrada em `public/knowledge/sources.json`.

## Desenvolvimento local

```bash
npm install
npm run dev
```

O comando usa `wrangler dev` e serve os arquivos definidos em `wrangler.jsonc`.

## Publicação na Cloudflare Workers

O projeto foi adaptado para **Workers Static Assets**. Não há Worker JavaScript de backend e não há etapa de compilação.

A configuração necessária já está versionada em `wrangler.jsonc`:

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "guiacrypto144",
  "compatibility_date": "2026-09-23",
  "assets": {
    "directory": "./public"
  }
}
```

Em um projeto conectado ao GitHub por **Workers Builds**, a configuração padrão pode ser mantida:

- comando de build: nenhum;
- comando de implantação: `npx wrangler deploy`;
- diretório raiz: raiz do repositório.

O Wrangler lê `wrangler.jsonc` e publica automaticamente `./public` como Static Assets.

Deploy manual equivalente:

```bash
npm run deploy
```

## Cloudflare Pages

A pasta `public/` contém somente os arquivos estáticos publicáveis e também pode ser usada como diretório de saída em um projeto Pages tradicional.

Para novos projetos Cloudflare, o fluxo recomendado neste repositório é Workers Static Assets, pois funciona diretamente com o comando padrão `npx wrangler deploy` e não exige Functions, KV, D1, R2 ou Workers AI.

## Segurança

- não há chaves, tokens ou credenciais no frontend;
- o caderno de rastreio permanece somente na memória da aba e não usa `localStorage`;
- `_headers` restringe framing, referrer, recursos e conexões externas;
- links para exploradores públicos só são abertos após ação do usuário;
- nunca inserir seed phrase, chave privada, senha, token ou informação sigilosa em página pública.

**Atenção:** publicar o site em `workers.dev` ou Pages não o torna privado. Se o uso for realmente restrito a uma organização, o controle de acesso deve ser realizado na camada da Cloudflare/infraestrutura apropriada.

## Git

Arquivos locais e credenciais são ignorados por `.gitignore`. Depois de clonar:

```bash
npm install
npm run dev
```

Nenhuma etapa de build adicional é necessária.
