(() => {
  'use strict';

  const MANIFEST_PATH = './knowledge/sources.json';

  const networkConfig = {
    bitcoin: {
      label: 'Bitcoin',
      family: 'utxo',
      explorers: [
        { label: 'Mempool.space', address: 'https://mempool.space/address/', transaction: 'https://mempool.space/tx/' },
        { label: 'Blockstream Explorer', address: 'https://blockstream.info/address/', transaction: 'https://blockstream.info/tx/' },
        { label: 'Blockchain.com', address: 'https://www.blockchain.com/explorer/addresses/btc/', transaction: 'https://www.blockchain.com/explorer/transactions/btc/' }
      ]
    },
    ethereum: {
      label: 'Ethereum',
      family: 'evm',
      explorers: [{ label: 'Etherscan', address: 'https://etherscan.io/address/', transaction: 'https://etherscan.io/tx/' }]
    },
    bsc: {
      label: 'BNB Smart Chain',
      family: 'evm',
      explorers: [{ label: 'BscScan', address: 'https://bscscan.com/address/', transaction: 'https://bscscan.com/tx/' }]
    },
    polygon: {
      label: 'Polygon',
      family: 'evm',
      explorers: [{ label: 'PolygonScan', address: 'https://polygonscan.com/address/', transaction: 'https://polygonscan.com/tx/' }]
    },
    arbitrum: {
      label: 'Arbitrum One',
      family: 'evm',
      explorers: [{ label: 'Arbiscan', address: 'https://arbiscan.io/address/', transaction: 'https://arbiscan.io/tx/' }]
    },
    base: {
      label: 'Base',
      family: 'evm',
      explorers: [{ label: 'BaseScan', address: 'https://basescan.org/address/', transaction: 'https://basescan.org/tx/' }]
    },
    optimism: {
      label: 'Optimism',
      family: 'evm',
      explorers: [{ label: 'OP Mainnet Explorer', address: 'https://optimistic.etherscan.io/address/', transaction: 'https://optimistic.etherscan.io/tx/' }]
    },
    tron: {
      label: 'TRON',
      family: 'tron',
      explorers: [{ label: 'TRONSCAN', address: 'https://tronscan.org/#/address/', transaction: 'https://tronscan.org/#/transaction/' }]
    },
    'evm-generic': {
      label: 'Outra rede EVM',
      family: 'evm',
      explorers: []
    }
  };

  const reportTemplates = {
    anatomy: `FICHA DE ANATOMIA DA TRANSAÇÃO

Rede: [rede]
Hash/TXID: [hash completo]
Status: [status]
Bloco: [bloco]
Timestamp UTC: [data/hora]
Origem: [endereço]
Destino/outputs: [endereço ou vout]
Ativo: [ativo]
Contrato do token: [se aplicável]
Valor: [valor]
Taxa: [taxa]
Fonte pública: [URL]
Data/hora da consulta: [data/hora]

OBSERVADO:
[descrever apenas os dados diretamente verificáveis]

INFERIDO:
[descrever a leitura analítica e a regra utilizada]

LIMITAÇÃO:
[registrar incertezas ou informação indisponível]`,
    flow: `CONCLUSÃO TÉCNICA DO FLUXO

Ponto de partida: [identificador / rede / ativo / valor]
Caminho documentado: [salto 1] → [salto 2] → [salto 3] → [destino]

OBSERVADO:
[hashes, endereços, valores, blocos e UTC]

INFERIDO:
[continuidade adotada, heurísticas e sinais convergentes]

CONFIRMADO PUBLICAMENTE:
[atribuições sustentadas por fonte pública autenticada ou convergente]

RAMOS NÃO SEGUIDOS:
[saída / motivo]

LIMITAÇÕES:
[o que a blockchain ou a fonte aberta não permite concluir]

DILIGÊNCIAS:
[providência necessária para confirmar identidade, titularidade ou operação off-chain]`,
    heuristic: `MATRIZ DE HEURÍSTICA

Hipótese analisada: [ex.: output X é provável troco]
Regra(s) aplicada(s): [nomear a heurística]

SINAIS A FAVOR:
- [sinal 1]
- [sinal 2]

SINAIS CONTRA / EXPLICAÇÕES ALTERNATIVAS:
- [contrapeso 1]
- [contrapeso 2]

GRAU DA HIPÓTESE:
[baixo / médio / alto, com fundamento]

LIMITAÇÃO:
[A heurística orienta a investigação e não demonstra, isoladamente, identidade ou controle civil.]`
  };

  const sourceState = {
    manifest: null,
    documents: new Map(),
    currentId: null,
    searchIndex: []
  };

  const ledgerState = [];

  const byId = (id) => document.getElementById(id);

  const escapeHtml = (value) => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const compactIdentifier = (value, size = 12) => {
    if (!value || value.length <= size * 2 + 1) return value || '';
    return `${value.slice(0, size)}…${value.slice(-size)}`;
  };

  const slugify = (value) => String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'secao';

  const safeHttpUrl = (value) => {
    try {
      const url = new URL(value);
      if (url.protocol === 'http:' || url.protocol === 'https:') return url.href;
    } catch (_error) {
      return null;
    }
    return null;
  };

  function detectIdentifierType(identifier, networkKey) {
    const network = networkConfig[networkKey];
    const value = identifier.trim();

    if (!network || !value) return 'unknown';

    if (network.family === 'utxo') {
      if (/^[a-fA-F0-9]{64}$/.test(value)) return 'transaction';
      if (/^(bc1[a-zA-Z0-9]{11,71}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/.test(value)) return 'address';
      return 'unknown';
    }

    if (network.family === 'evm') {
      if (/^0x[a-fA-F0-9]{64}$/.test(value)) return 'transaction';
      if (/^0x[a-fA-F0-9]{40}$/.test(value)) return 'address';
      return 'unknown';
    }

    if (network.family === 'tron') {
      if (/^[a-fA-F0-9]{64}$/.test(value)) return 'transaction';
      if (/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(value)) return 'address';
      return 'unknown';
    }

    return 'unknown';
  }

  function validateIdentifier(identifier, requestedType, networkKey) {
    const value = identifier.trim();
    const network = networkConfig[networkKey];
    const detected = detectIdentifierType(value, networkKey);
    const normalizedRequested = requestedType === 'contract' ? 'address' : requestedType;

    if (!value) {
      return { valid: false, detected: 'unknown', message: 'Informe um identificador público on-chain.' };
    }

    if (!network) {
      return { valid: false, detected: 'unknown', message: 'Rede não reconhecida.' };
    }

    if (requestedType === 'auto') {
      if (detected === 'unknown') {
        return { valid: false, detected, message: 'O formato não corresponde ao padrão básico esperado para a rede selecionada.' };
      }
      return { valid: true, detected, message: 'Formato sintaticamente compatível. Confirme a existência do dado na fonte primária.' };
    }

    if (detected === normalizedRequested) {
      return { valid: true, detected, message: 'Formato sintaticamente compatível. Confirme a existência do dado na fonte primária.' };
    }

    if (requestedType === 'contract' && detected === 'address' && network.family === 'evm') {
      return { valid: true, detected: 'contract', message: 'Formato compatível com endereço EVM. Confirme no explorador se há bytecode/aba Contract.' };
    }

    return { valid: false, detected, message: 'O tipo selecionado não corresponde ao formato detectado para essa rede.' };
  }

  function getExplorerLinks(networkKey, identifier, identifierType) {
    const network = networkConfig[networkKey];
    if (!network || network.explorers.length === 0) return [];

    const route = identifierType === 'transaction' ? 'transaction' : 'address';
    return network.explorers
      .filter((explorer) => explorer[route])
      .map((explorer) => ({
        label: explorer.label,
        href: `${explorer[route]}${encodeURIComponent(identifier)}`
      }));
  }

  function buildTriagePlan(networkKey, identifierType) {
    const network = networkConfig[networkKey];
    if (!network) return [];

    if (network.family === 'utxo') {
      return [
        'Abrir a transação ou o histórico do endereço e registrar TXID, bloco e UTC.',
        'Mapear inputs, outputs, valores e fee; em seguida, identificar o UTXO/vout relevante.',
        'Se houver mais de uma saída, formular a hipótese de continuidade ou troco com sinais convergentes.',
        'Registrar CoinJoin, PayJoin, lote, consolidação ou peel chain quando o desenho indicar essas possibilidades.',
        'Seguir apenas os outputs justificados e documentar ramos não seguidos.'
      ];
    }

    if (network.family === 'tron') {
      return [
        'Confirmar hash, bloco, UTC, From, To, valor e status no TRONSCAN.',
        'Distinguir TRX de TRC-20 e validar o contrato do token.',
        'Verificar ativação, primeira entrada de TRX e eventual delegação de Energy/Bandwidth.',
        'Se houver contrato, reconstruir transferências de token e o efeito econômico.',
        'Prosseguir até ponto de atribuição pública, VASP/PSAV ou limite justificável.'
      ];
    }

    const firstStep = identifierType === 'contract'
      ? 'Confirmar rede, código/aba Contract, token tracker e endereço completo do contrato.'
      : 'Confirmar hash/endereço na rede selecionada e registrar bloco, UTC, origem e destino.';

    return [
      firstStep,
      'Distinguir moeda nativa de tokens e validar o contrato de cada ativo.',
      'Comparar Overview, Token Transfers, Internal Transactions, Input Data e Logs quando existirem.',
      'Se o To for contrato/router/bridge, seguir os efeitos econômicos até o destinatário resultante.',
      'Verificar gas funding, swaps, bridges e possível off-ramp sem transformar rótulo em prova.'
    ];
  }

  function renderTriageResult({ networkKey, identifier, requestedType, validation }) {
    const result = byId('triage-result');
    if (!result) return;

    const network = networkConfig[networkKey];
    const effectiveType = requestedType === 'auto' ? validation.detected : requestedType;
    const links = validation.valid ? getExplorerLinks(networkKey, identifier, effectiveType) : [];
    const plan = validation.valid ? buildTriagePlan(networkKey, effectiveType) : [];
    const badgeClass = validation.valid ? 'ok' : 'warn';
    const badgeText = validation.valid ? 'Formato compatível' : 'Revisar formato';

    const linksHtml = links.length
      ? `<div class="result-actions">${links.map((link) => `<a class="button button-secondary" href="${escapeHtml(link.href)}" target="_blank" rel="noopener noreferrer">Abrir ${escapeHtml(link.label)}</a>`).join('')}</div>`
      : '<p>Nenhum explorador específico foi configurado para esta rede. Selecione manualmente um explorador público da cadeia correta.</p>';

    const planHtml = plan.length
      ? `<ol>${plan.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ol>`
      : '';

    result.innerHTML = `
      <div class="result-grid">
        <div class="result-card">
          <span class="result-badge ${badgeClass}">${badgeText}</span>
          <h3>${escapeHtml(network.label)} · ${escapeHtml(effectiveType || 'identificador')}</h3>
          <p><code>${escapeHtml(compactIdentifier(identifier, 16))}</code></p>
          <p>${escapeHtml(validation.message)}</p>
          ${validation.valid ? linksHtml : ''}
        </div>
        <div class="result-card">
          <h3>Roteiro inicial</h3>
          ${planHtml || '<p>Corrija o identificador para gerar o roteiro.</p>'}
        </div>
      </div>`;
    result.hidden = false;
  }

  function initTriage() {
    const form = byId('triage-form');
    const resetButton = byId('triage-reset');
    const result = byId('triage-result');
    if (!form || !result) return;

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const networkKey = String(data.get('network') || '');
      const requestedType = String(data.get('identifierType') || 'auto');
      const identifier = String(data.get('identifier') || '').trim();
      const validation = validateIdentifier(identifier, requestedType, networkKey);
      renderTriageResult({ networkKey, identifier, requestedType, validation });
    });

    resetButton?.addEventListener('click', () => {
      result.hidden = true;
      result.replaceChildren();
    });
  }

  function activatePlaybook(name) {
    const tabs = [...document.querySelectorAll('.playbook-tab')];
    const panels = [...document.querySelectorAll('.playbook-panel')];

    tabs.forEach((tab) => {
      const active = tab.dataset.playbook === name;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });

    panels.forEach((panel) => {
      panel.hidden = panel.id !== `playbook-${name}`;
    });
  }

  function initPlaybooks() {
    const tabs = [...document.querySelectorAll('.playbook-tab')];
    if (!tabs.length) return;

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activatePlaybook(tab.dataset.playbook));
      tab.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        let nextIndex = index;
        if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
        if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = tabs.length - 1;
        tabs[nextIndex].focus();
        activatePlaybook(tabs[nextIndex].dataset.playbook);
      });
    });
  }

  function makeCell(text, className = '') {
    const cell = document.createElement('td');
    cell.textContent = text || '—';
    if (className) cell.className = className;
    return cell;
  }

  function renderLedger() {
    const tbody = byId('ledger-body');
    const count = byId('ledger-count');
    const exportCsv = byId('export-csv');
    const exportJson = byId('export-json');
    const clearLedger = byId('clear-ledger');
    if (!tbody || !count) return;

    tbody.replaceChildren();

    if (ledgerState.length === 0) {
      const row = document.createElement('tr');
      row.className = 'empty-row';
      const cell = document.createElement('td');
      cell.colSpan = 9;
      cell.textContent = 'Adicione o primeiro salto pelo formulário acima.';
      row.append(cell);
      tbody.append(row);
      count.textContent = 'Nenhum salto registrado.';
    } else {
      ledgerState.forEach((hop, index) => {
        const row = document.createElement('tr');
        row.append(makeCell(String(index + 1)));
        row.append(makeCell(hop.network));

        const txCell = makeCell(compactIdentifier(hop.txid, 10), 'cell-mono');
        txCell.title = hop.txid;
        row.append(txCell);

        const originCell = makeCell(compactIdentifier(hop.origin, 8), 'cell-mono');
        originCell.title = hop.origin;
        row.append(originCell);

        const destinationCell = makeCell(compactIdentifier(hop.destination, 8), 'cell-mono');
        destinationCell.title = hop.destination;
        row.append(destinationCell);

        row.append(makeCell([hop.asset, hop.value].filter(Boolean).join(' · ')));
        row.append(makeCell(hop.utc));
        row.append(makeCell(hop.classification));

        const actionCell = document.createElement('td');
        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'remove-hop';
        removeButton.dataset.index = String(index);
        removeButton.textContent = 'Remover';
        removeButton.setAttribute('aria-label', `Remover salto ${index + 1}`);
        actionCell.append(removeButton);
        row.append(actionCell);
        tbody.append(row);
      });
      count.textContent = `${ledgerState.length} ${ledgerState.length === 1 ? 'salto registrado' : 'saltos registrados'}.`;
    }

    const disabled = ledgerState.length === 0;
    [exportCsv, exportJson, clearLedger].forEach((button) => {
      if (button) button.disabled = disabled;
    });
  }

  function downloadText(filename, content, mimeType) {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function csvEscape(value) {
    const text = String(value ?? '');
    if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
    return text;
  }

  function exportLedgerCsv() {
    if (!ledgerState.length) return;
    const headers = ['ordem', 'rede', 'txid', 'origem', 'destino', 'ativo', 'contrato', 'valor', 'bloco', 'utc', 'classificacao', 'fonte', 'observacoes'];
    const rows = ledgerState.map((hop, index) => [
      index + 1,
      hop.network,
      hop.txid,
      hop.origin,
      hop.destination,
      hop.asset,
      hop.contract,
      hop.value,
      hop.block,
      hop.utc,
      hop.classification,
      hop.source,
      hop.notes
    ]);
    const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
    downloadText(`guiacrypto144-saltos-${new Date().toISOString().slice(0, 10)}.csv`, `\uFEFF${csv}`, 'text/csv');
  }

  function exportLedgerJson() {
    if (!ledgerState.length) return;
    const payload = {
      exportedAt: new Date().toISOString(),
      project: 'GuiaCrypto144',
      persistence: 'client-memory-only',
      hops: ledgerState
    };
    downloadText(`guiacrypto144-saltos-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(payload, null, 2), 'application/json');
  }

  function initLedger() {
    const form = byId('hop-form');
    const tbody = byId('ledger-body');
    if (!form || !tbody) return;

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      ledgerState.push({
        network: String(data.get('network') || '').trim(),
        txid: String(data.get('txid') || '').trim(),
        origin: String(data.get('origin') || '').trim(),
        destination: String(data.get('destination') || '').trim(),
        asset: String(data.get('asset') || '').trim(),
        contract: String(data.get('contract') || '').trim(),
        value: String(data.get('value') || '').trim(),
        block: String(data.get('block') || '').trim(),
        utc: String(data.get('utc') || '').trim(),
        classification: String(data.get('classification') || 'Observado'),
        source: String(data.get('source') || '').trim(),
        notes: String(data.get('notes') || '').trim()
      });
      form.reset();
      renderLedger();
    });

    tbody.addEventListener('click', (event) => {
      const button = event.target.closest('.remove-hop');
      if (!button) return;
      const index = Number(button.dataset.index);
      if (!Number.isInteger(index) || index < 0 || index >= ledgerState.length) return;
      ledgerState.splice(index, 1);
      renderLedger();
    });

    byId('export-csv')?.addEventListener('click', exportLedgerCsv);
    byId('export-json')?.addEventListener('click', exportLedgerJson);
    byId('clear-ledger')?.addEventListener('click', () => {
      if (!ledgerState.length) return;
      if (!window.confirm('Apagar todos os saltos desta aba? Esta ação não pode ser desfeita.')) return;
      ledgerState.splice(0, ledgerState.length);
      renderLedger();
    });

    renderLedger();
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.className = 'clipboard-fallback';
    document.body.append(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    if (!ok) throw new Error('Não foi possível copiar o texto.');
  }

  function initTemplates() {
    const status = byId('copy-status');
    document.querySelectorAll('.copy-template').forEach((button) => {
      button.addEventListener('click', async () => {
        const template = reportTemplates[button.dataset.template];
        if (!template) return;
        try {
          await copyText(template);
          if (status) status.textContent = 'Modelo copiado para a área de transferência.';
        } catch (error) {
          if (status) status.textContent = `Falha ao copiar: ${error.message}`;
        }
      });
    });
  }

  function tokenizeInline(text) {
    const tokens = [];
    const createToken = (html) => {
      const key = `\u0000INLINE${tokens.length}\u0000`;
      tokens.push({ key, html });
      return key;
    };

    let working = String(text);
    working = working.replace(/`([^`]+)`/g, (_match, code) => createToken(`<code>${escapeHtml(code)}</code>`));
    working = working.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_match, label, href) => {
      const safe = safeHttpUrl(href);
      if (!safe) return label;
      return createToken(`<a href="${escapeHtml(safe)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`);
    });

    let html = escapeHtml(working);
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    html = html.replace(/(^|\s)\*([^*\n]+)\*(?=\s|$|[.,;:!?])/g, '$1<em>$2</em>');

    tokens.forEach(({ key, html: tokenHtml }) => {
      html = html.replaceAll(key, tokenHtml);
    });
    return html;
  }

  function parseTableRow(line) {
    return line.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim());
  }

  function isTableSeparator(line) {
    const cells = parseTableRow(line);
    return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
  }

  function renderMarkdown(markdown) {
    const lines = String(markdown).replace(/^\uFEFF/, '').replaceAll('\r\n', '\n').split('\n');
    const html = [];
    const headings = [];
    const slugCounts = new Map();
    let paragraph = [];
    let listType = null;
    let listItems = [];
    let inCode = false;
    let codeLanguage = '';
    let codeLines = [];

    const flushParagraph = () => {
      if (!paragraph.length) return;
      html.push(`<p>${tokenizeInline(paragraph.join(' '))}</p>`);
      paragraph = [];
    };

    const flushList = () => {
      if (!listType || !listItems.length) return;
      html.push(`<${listType}>${listItems.map((item) => `<li>${tokenizeInline(item)}</li>`).join('')}</${listType}>`);
      listType = null;
      listItems = [];
    };

    const flushCode = () => {
      const languageClass = codeLanguage ? ` class="language-${escapeHtml(codeLanguage)}"` : '';
      html.push(`<pre><code${languageClass}>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
      codeLines = [];
      codeLanguage = '';
    };

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];

      if (line.trim().startsWith('```')) {
        flushParagraph();
        flushList();
        if (inCode) {
          flushCode();
          inCode = false;
        } else {
          inCode = true;
          codeLanguage = line.trim().slice(3).trim();
        }
        continue;
      }

      if (inCode) {
        codeLines.push(line);
        continue;
      }

      if (!line.trim()) {
        flushParagraph();
        flushList();
        continue;
      }

      const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
      if (headingMatch) {
        flushParagraph();
        flushList();
        const level = headingMatch[1].length;
        const rawText = headingMatch[2].replace(/\s+#+\s*$/, '').trim();
        const baseSlug = slugify(rawText);
        const count = slugCounts.get(baseSlug) || 0;
        slugCounts.set(baseSlug, count + 1);
        const id = count === 0 ? baseSlug : `${baseSlug}-${count + 1}`;
        headings.push({ level, text: rawText.replace(/[*_`]/g, ''), id });
        html.push(`<h${level} id="${escapeHtml(id)}">${tokenizeInline(rawText)}</h${level}>`);
        continue;
      }

      if (/^\s*([-*_])(?:\s*\1){2,}\s*$/.test(line)) {
        flushParagraph();
        flushList();
        html.push('<hr>');
        continue;
      }

      const nextLine = lines[index + 1] || '';
      if (line.includes('|') && isTableSeparator(nextLine)) {
        flushParagraph();
        flushList();
        const headers = parseTableRow(line);
        const rows = [];
        index += 2;
        while (index < lines.length && lines[index].trim() && lines[index].includes('|')) {
          rows.push(parseTableRow(lines[index]));
          index += 1;
        }
        index -= 1;
        const headerHtml = headers.map((cell) => `<th>${tokenizeInline(cell)}</th>`).join('');
        const bodyHtml = rows.map((row) => `<tr>${headers.map((_header, cellIndex) => `<td>${tokenizeInline(row[cellIndex] || '')}</td>`).join('')}</tr>`).join('');
        html.push(`<div class="table-wrap"><table><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></div>`);
        continue;
      }

      const unorderedMatch = line.match(/^\s*[-+*]\s+(.+)$/);
      const orderedMatch = line.match(/^\s*\d+[.)]\s+(.+)$/);
      if (unorderedMatch || orderedMatch) {
        flushParagraph();
        const nextType = unorderedMatch ? 'ul' : 'ol';
        if (listType && listType !== nextType) flushList();
        listType = nextType;
        listItems.push((unorderedMatch || orderedMatch)[1]);
        continue;
      }

      const quoteMatch = line.match(/^>\s?(.*)$/);
      if (quoteMatch) {
        flushParagraph();
        flushList();
        html.push(`<blockquote><p>${tokenizeInline(quoteMatch[1])}</p></blockquote>`);
        continue;
      }

      paragraph.push(line.trim());
    }

    if (inCode) flushCode();
    flushParagraph();
    flushList();

    return { html: html.join('\n'), headings };
  }

  function stripMarkdown(markdown) {
    return String(markdown)
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_`>|~-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function buildSearchIndex() {
    const index = [];
    for (const [sourceId, documentData] of sourceState.documents.entries()) {
      const lines = documentData.text.replaceAll('\r\n', '\n').split('\n');
      let currentHeading = documentData.label;
      let currentLevel = 1;
      let buffer = [];

      const pushSection = () => {
        const body = stripMarkdown(buffer.join('\n'));
        if (body || currentHeading) {
          index.push({ sourceId, sourceLabel: documentData.label, heading: currentHeading, level: currentLevel, text: body });
        }
        buffer = [];
      };

      lines.forEach((line) => {
        const match = line.match(/^(#{1,4})\s+(.+)$/);
        if (match) {
          pushSection();
          currentLevel = match[1].length;
          currentHeading = stripMarkdown(match[2]);
        } else {
          buffer.push(line);
        }
      });
      pushSection();
    }
    sourceState.searchIndex = index;
  }

  function renderToc(headings) {
    const toc = byId('knowledge-toc');
    if (!toc) return;
    toc.replaceChildren();

    const relevant = headings.filter((heading) => heading.level <= 3);
    if (!relevant.length) {
      const text = document.createElement('p');
      text.textContent = 'Sem títulos identificados.';
      toc.append(text);
      return;
    }

    relevant.forEach((heading) => {
      const link = document.createElement('a');
      link.href = `#${heading.id}`;
      link.textContent = heading.text;
      link.dataset.level = String(heading.level);
      toc.append(link);
    });
  }

  function renderSource(sourceId, focusHeading = '') {
    const viewer = byId('knowledge-viewer');
    const select = byId('source-select');
    if (!viewer || !select) return;

    const documentData = sourceState.documents.get(sourceId);
    if (!documentData) return;

    sourceState.currentId = sourceId;
    select.value = sourceId;
    const rendered = renderMarkdown(documentData.text);
    viewer.innerHTML = rendered.html || '<p>Documento vazio.</p>';
    renderToc(rendered.headings);

    if (focusHeading) {
      const id = slugify(focusHeading);
      requestAnimationFrame(() => {
        const target = byId(id) || [...viewer.querySelectorAll('h1,h2,h3,h4')].find((heading) => heading.textContent.trim().toLowerCase() === focusHeading.trim().toLowerCase());
        target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }

  function renderSourceSelector() {
    const select = byId('source-select');
    if (!select) return;
    select.replaceChildren();

    for (const [id, documentData] of sourceState.documents.entries()) {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = documentData.label;
      select.append(option);
    }

    select.disabled = sourceState.documents.size === 0;
    if (sourceState.documents.size > 0) {
      const firstId = sourceState.documents.keys().next().value;
      renderSource(firstId);
    }
  }

  function renderSearchResults(query) {
    const container = byId('search-results');
    if (!container) return;

    const normalized = query.trim().toLocaleLowerCase('pt-BR');
    if (normalized.length < 2) {
      container.hidden = true;
      container.replaceChildren();
      return;
    }

    const terms = normalized.split(/\s+/).filter(Boolean);
    const matches = sourceState.searchIndex
      .map((entry) => {
        const haystack = `${entry.heading} ${entry.text}`.toLocaleLowerCase('pt-BR');
        const matchedTerms = terms.filter((term) => haystack.includes(term));
        return { entry, score: matchedTerms.length + (entry.heading.toLocaleLowerCase('pt-BR').includes(normalized) ? 2 : 0) };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 18);

    container.replaceChildren();

    if (!matches.length) {
      const empty = document.createElement('p');
      empty.className = 'panel search-empty';
      empty.textContent = 'Nenhum trecho encontrado nas bases carregadas.';
      container.append(empty);
      container.hidden = false;
      return;
    }

    matches.forEach(({ entry }) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'search-result';
      button.dataset.sourceId = entry.sourceId;
      button.dataset.heading = entry.heading;

      const title = document.createElement('strong');
      title.textContent = entry.heading || 'Trecho sem título';
      const source = document.createElement('span');
      source.textContent = entry.sourceLabel;
      const excerpt = document.createElement('small');
      const compact = entry.text.length > 230 ? `${entry.text.slice(0, 230)}…` : entry.text;
      excerpt.textContent = compact || 'Título encontrado no documento.';

      button.append(title, source, excerpt);
      container.append(button);
    });
    container.hidden = false;
  }

  async function loadSources() {
    const status = byId('knowledge-status');
    const searchInput = byId('knowledge-search');
    const select = byId('source-select');
    if (!status || !searchInput || !select) return;

    status.classList.remove('error');
    status.textContent = 'Carregando fontes locais...';
    searchInput.disabled = true;
    select.disabled = true;
    sourceState.documents.clear();
    sourceState.searchIndex = [];

    try {
      const manifestResponse = await fetch(MANIFEST_PATH, { cache: 'no-store' });
      if (!manifestResponse.ok) throw new Error(`Manifesto indisponível (${manifestResponse.status}).`);
      const manifest = await manifestResponse.json();
      if (!manifest || !Array.isArray(manifest.sources)) throw new Error('Manifesto knowledge/sources.json inválido.');
      sourceState.manifest = manifest;

      const results = await Promise.allSettled(manifest.sources.map(async (source) => {
        if (!source || typeof source.id !== 'string' || typeof source.path !== 'string') throw new Error('Entrada de fonte inválida.');
        const response = await fetch(source.path, { cache: 'no-store' });
        if (!response.ok) throw new Error(`${source.label || source.id}: HTTP ${response.status}`);
        return {
          id: source.id,
          label: source.label || source.id,
          description: source.description || '',
          path: source.path,
          text: await response.text()
        };
      }));

      const failures = [];
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          sourceState.documents.set(result.value.id, result.value);
        } else {
          failures.push(result.reason?.message || 'Falha desconhecida');
        }
      });

      if (sourceState.documents.size === 0) throw new Error(`Nenhuma base pôde ser carregada. ${failures.join(' | ')}`);

      renderSourceSelector();
      buildSearchIndex();
      searchInput.disabled = false;
      status.textContent = `${sourceState.documents.size} ${sourceState.documents.size === 1 ? 'fonte carregada' : 'fontes carregadas'} diretamente do repositório.${failures.length ? ` ${failures.length} fonte(s) não carregada(s).` : ''}`;
    } catch (error) {
      status.classList.add('error');
      status.textContent = `Não foi possível carregar as bases. Execute o site por um servidor local (por exemplo, npm run dev) e confira knowledge/sources.json. Detalhe: ${error.message}`;
      const viewer = byId('knowledge-viewer');
      const toc = byId('knowledge-toc');
      if (viewer) viewer.innerHTML = '<p>A interface principal continua disponível, mas a visualização dinâmica das bases está indisponível.</p>';
      if (toc) toc.replaceChildren();
    }
  }

  function initKnowledge() {
    const select = byId('source-select');
    const searchInput = byId('knowledge-search');
    const results = byId('search-results');
    const reloadButton = byId('reload-sources');
    let debounceTimer = null;

    select?.addEventListener('change', () => renderSource(select.value));

    searchInput?.addEventListener('input', () => {
      window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(() => renderSearchResults(searchInput.value), 140);
    });

    results?.addEventListener('click', (event) => {
      const button = event.target.closest('.search-result');
      if (!button) return;
      renderSource(button.dataset.sourceId, button.dataset.heading);
    });

    reloadButton?.addEventListener('click', async () => {
      if (searchInput) searchInput.value = '';
      if (results) {
        results.hidden = true;
        results.replaceChildren();
      }
      await loadSources();
    });

    loadSources();
  }

  function initExternalLinks() {
    document.querySelectorAll('a[target="_blank"]').forEach((link) => {
      const rel = new Set((link.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
      rel.add('noopener');
      rel.add('noreferrer');
      link.setAttribute('rel', [...rel].join(' '));
    });
  }

  function init() {
    initTriage();
    initPlaybooks();
    initLedger();
    initTemplates();
    initKnowledge();
    initExternalLinks();
  }

  init();
})();
