(() => {
  'use strict';

  const MANIFEST_PATH = './knowledge/sources.json';

  const networkConfig = {
    bitcoin: {
      label: 'Bitcoin',
      family: 'utxo',
      explorerLinks: {
        address: [
          ['Mempool.space', 'https://mempool.space/address/'],
          ['Blockstream', 'https://blockstream.info/address/']
        ],
        transaction: [
          ['Mempool.space', 'https://mempool.space/tx/'],
          ['Blockstream', 'https://blockstream.info/tx/']
        ]
      }
    },
    ethereum: {
      label: 'Ethereum', family: 'evm', explorerLinks: {
        address: [['Etherscan', 'https://etherscan.io/address/']],
        transaction: [['Etherscan', 'https://etherscan.io/tx/']]
      }
    },
    bsc: {
      label: 'BNB Smart Chain', family: 'evm', explorerLinks: {
        address: [['BscScan', 'https://bscscan.com/address/']],
        transaction: [['BscScan', 'https://bscscan.com/tx/']]
      }
    },
    polygon: {
      label: 'Polygon', family: 'evm', explorerLinks: {
        address: [['PolygonScan', 'https://polygonscan.com/address/']],
        transaction: [['PolygonScan', 'https://polygonscan.com/tx/']]
      }
    },
    arbitrum: {
      label: 'Arbitrum One', family: 'evm', explorerLinks: {
        address: [['Arbiscan', 'https://arbiscan.io/address/']],
        transaction: [['Arbiscan', 'https://arbiscan.io/tx/']]
      }
    },
    base: {
      label: 'Base', family: 'evm', explorerLinks: {
        address: [['BaseScan', 'https://basescan.org/address/']],
        transaction: [['BaseScan', 'https://basescan.org/tx/']]
      }
    },
    optimism: {
      label: 'Optimism', family: 'evm', explorerLinks: {
        address: [['OP Explorer', 'https://optimistic.etherscan.io/address/']],
        transaction: [['OP Explorer', 'https://optimistic.etherscan.io/tx/']]
      }
    },
    tron: {
      label: 'TRON', family: 'tron', explorerLinks: {
        address: [['TRONSCAN', 'https://tronscan.org/#/address/']],
        transaction: [['TRONSCAN', 'https://tronscan.org/#/transaction/']]
      }
    },
    evm: { label: 'Outra rede EVM', family: 'evm', explorerLinks: { address: [], transaction: [] } }
  };

  const playbooks = {
    utxo: {
      steps: [
        'Confirmar TXID, bloco, UTC e status.',
        'Mapear inputs, outputs, valores e fee. Selecionar o vout/UTXO relevante.',
        'Se houver mais de uma saída, declarar a hipótese de troco antes de seguir: reuso, formato, script, valor e contexto.',
        'Aplicar CIOH apenas com cautela. CoinJoin, PayJoin e custodiante podem gerar falso positivo.',
        'Registrar lote, consolidação ou peel chain quando presentes e documentar os ramos não seguidos.',
        'Prosseguir até VASP/PSAV, atribuição pública ou limite justificável.'
      ],
      cautions: 'O saldo do endereço não substitui a análise da transação. Heurística indica probabilidade; não identifica pessoa.'
    },
    evm: {
      steps: [
        'Confirmar rede, hash, bloco, UTC, status, From, To/Interacted With, Value e taxa.',
        'Distinguir moeda nativa de token. Para token, confirmar endereço do contrato e decimais.',
        'Ler Token Transfers e Logs. Em contrato/DeFi, verificar Internal Txns e reconstruir o resultado econômico.',
        'Não confundir contrato/router com destinatário econômico.',
        'Verificar primeiro gas funding quando relevante e testar explicações alternativas: exchange, faucet, bridge, relayer ou paymaster.',
        'Em bridge, obter rede de destino, recipient, identificador de correlação e confirmar o hash na rede alvo.'
      ],
      cautions: 'O mesmo endereço 0x pode existir em várias redes EVM. Rede e contrato do token devem constar no registro.'
    },
    tron: {
      steps: [
        'Confirmar hash, bloco, UTC, status, origem e destino no TRONSCAN.',
        'Distinguir TRX de TRC-20 e confirmar o contrato do token.',
        'Verificar ativação, primeira entrada de TRX e início da atividade do token.',
        'Ler Bandwidth, Energy e eventual staking/delegação antes de concluir ausência de funding.',
        'Seguir transferências relevantes até VASP/PSAV, atribuição pública ou limite justificável.'
      ],
      cautions: 'Ausência de transferência TRX visível não prova ausência de suporte operacional: recursos podem ter sido delegados.'
    }
  };

  const ledger = [];
  const knowledge = { sources: [], documents: [] };

  const byId = (id) => document.getElementById(id);

  const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const compact = (value, size = 10) => {
    const text = String(value ?? '');
    if (text.length <= size * 2 + 1) return text;
    return `${text.slice(0, size)}…${text.slice(-size)}`;
  };

  function detectType(value, networkKey) {
    const text = value.trim();
    const network = networkConfig[networkKey];
    if (!text || !network) return 'unknown';

    if (network.family === 'utxo') {
      if (/^[a-fA-F0-9]{64}$/.test(text)) return 'transaction';
      if (/^(bc1[a-zA-Z0-9]{11,71}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/.test(text)) return 'address';
    }

    if (network.family === 'evm') {
      if (/^0x[a-fA-F0-9]{64}$/.test(text)) return 'transaction';
      if (/^0x[a-fA-F0-9]{40}$/.test(text)) return 'address';
    }

    if (network.family === 'tron') {
      if (/^[a-fA-F0-9]{64}$/.test(text)) return 'transaction';
      if (/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(text)) return 'address';
    }

    return 'unknown';
  }

  function validateIdentifier(value, requestedType, networkKey) {
    const detected = detectType(value, networkKey);
    const expected = requestedType === 'contract' ? 'address' : requestedType;

    if (!value.trim()) return { valid: false, detected, message: 'Informe o identificador.' };
    if (detected === 'unknown') return { valid: false, detected, message: 'Formato não reconhecido para a rede selecionada.' };
    if (requestedType !== 'auto' && detected !== expected) {
      return { valid: false, detected, message: 'O formato não corresponde ao tipo selecionado.' };
    }
    if (requestedType === 'contract' && networkConfig[networkKey]?.family !== 'evm') {
      return { valid: false, detected, message: 'A verificação de contrato por endereço está disponível apenas para redes EVM.' };
    }
    return { valid: true, detected: requestedType === 'contract' ? 'contract' : detected, message: 'Formato compatível. Confirme o dado no explorador.' };
  }

  function renderPlaybook(networkKey) {
    const target = byId('playbook');
    if (!target) return;
    const network = networkConfig[networkKey] || networkConfig.bitcoin;
    const book = playbooks[network.family] || playbooks.evm;
    target.innerHTML = `
      <div>
        <h3>${escapeHtml(network.label)}</h3>
        <ol>${book.steps.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ol>
      </div>
      <p class="playbook-note"><strong>Cautela:</strong> ${escapeHtml(book.cautions)}</p>
    `;
  }

  function explorerLinks(networkKey, type, identifier) {
    const network = networkConfig[networkKey];
    if (!network) return [];
    const route = type === 'transaction' ? 'transaction' : 'address';
    return (network.explorerLinks[route] || []).map(([label, prefix]) => ({
      label,
      href: `${prefix}${encodeURIComponent(identifier)}`
    }));
  }

  function handleTriage(event) {
    event.preventDefault();
    const networkKey = byId('network')?.value || 'bitcoin';
    const requestedType = byId('identifier-type')?.value || 'auto';
    const identifier = byId('identifier')?.value || '';
    const result = byId('triage-result');
    if (!result) return;

    const check = validateIdentifier(identifier, requestedType, networkKey);
    result.hidden = false;
    result.classList.toggle('error', !check.valid);

    if (!check.valid) {
      result.innerHTML = `<strong>Verificação:</strong> ${escapeHtml(check.message)}`;
      return;
    }

    const effectiveType = check.detected === 'contract' ? 'address' : check.detected;
    const links = explorerLinks(networkKey, effectiveType, identifier.trim());
    const contractNote = check.detected === 'contract'
      ? ' Confirme bytecode/aba Contract e o endereço exato do token.'
      : '';

    result.innerHTML = `
      <div><strong>${escapeHtml(networkConfig[networkKey].label)}:</strong> ${escapeHtml(check.message)}${escapeHtml(contractNote)}</div>
      <div class="result-links">
        ${links.length
          ? links.map((link) => `<a href="${link.href}" target="_blank" rel="noopener noreferrer">Abrir ${escapeHtml(link.label)}</a>`).join('')
          : '<span>Abra o explorador oficial/adequado da rede selecionada e registre a URL consultada.</span>'}
      </div>
    `;

    renderPlaybook(networkKey);
    const hopNetwork = byId('hop-network');
    const selectedText = byId('network')?.selectedOptions?.[0]?.textContent;
    if (hopNetwork && selectedText) {
      const option = [...hopNetwork.options].find((item) => item.textContent === selectedText);
      if (option) hopNetwork.value = option.value;
    }
  }

  function csvCell(value) {
    const text = String(value ?? '');
    return `"${text.replaceAll('"', '""')}"`;
  }

  function renderLedger() {
    const body = byId('ledger-body');
    if (!body) return;
    if (ledger.length === 0) {
      body.innerHTML = '<tr id="ledger-empty"><td colspan="10">Nenhum salto registrado.</td></tr>';
      return;
    }

    body.innerHTML = ledger.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(item.network)}</td>
        <td class="code-cell" title="${escapeHtml(item.hash)}">${escapeHtml(compact(item.hash))}</td>
        <td>${escapeHtml(item.utc)}</td>
        <td class="code-cell" title="${escapeHtml(item.from)}">${escapeHtml(compact(item.from))}</td>
        <td class="code-cell" title="${escapeHtml(item.to)}">${escapeHtml(compact(item.to))}</td>
        <td>${escapeHtml(item.asset)}</td>
        <td>${escapeHtml(item.value)}</td>
        <td>${escapeHtml(item.classification)}</td>
        <td><button class="remove-hop" type="button" data-remove-hop="${index}" aria-label="Remover salto ${index + 1}">Remover</button></td>
      </tr>
    `).join('');
  }

  function handleHop(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!(form instanceof HTMLFormElement)) return;
    const data = new FormData(form);
    const item = {
      network: String(data.get('hopNetwork') || '').trim(),
      kind: String(data.get('hopKind') || '').trim(),
      hash: String(data.get('hopHash') || '').trim(),
      utc: String(data.get('hopUtc') || '').trim(),
      from: String(data.get('hopFrom') || '').trim(),
      to: String(data.get('hopTo') || '').trim(),
      asset: String(data.get('hopAsset') || '').trim(),
      value: String(data.get('hopValue') || '').trim(),
      classification: String(data.get('hopClassification') || '').trim(),
      basis: String(data.get('hopBasis') || '').trim()
    };

    const required = ['hash', 'utc', 'from', 'to', 'asset', 'value'];
    if (required.some((key) => !item[key])) {
      setLedgerStatus('Preencha hash, UTC, origem, destino, ativo e valor.', 'error');
      return;
    }

    ledger.push(item);
    renderLedger();
    setLedgerStatus(`Salto ${ledger.length} registrado nesta aba.`, 'ok');
    form.reset();
  }

  function setLedgerStatus(message, type = '') {
    const status = byId('ledger-status');
    if (!status) return;
    status.textContent = message;
    status.className = `status-text${type ? ` ${type}` : ''}`;
  }

  function removeHop(index) {
    if (!Number.isInteger(index) || index < 0 || index >= ledger.length) return;
    ledger.splice(index, 1);
    renderLedger();
    setLedgerStatus('Registro removido.', 'ok');
  }

  function clearLedger() {
    ledger.splice(0, ledger.length);
    renderLedger();
    setLedgerStatus('Caderno limpo.', 'ok');
  }

  function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function exportCsv() {
    if (ledger.length === 0) return setLedgerStatus('Não há saltos para exportar.', 'error');
    const headers = ['salto','rede','natureza','hash_txid','utc','origem','destino','ativo','valor','classificacao','fundamento'];
    const rows = ledger.map((item, index) => [
      index + 1, item.network, item.kind, item.hash, item.utc, item.from, item.to, item.asset, item.value, item.classification, item.basis
    ]);
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
    downloadFile('guiacrypto144-rastreio.csv', `\uFEFF${csv}`, 'text/csv;charset=utf-8');
    setLedgerStatus('CSV gerado.', 'ok');
  }

  function exportJson() {
    if (ledger.length === 0) return setLedgerStatus('Não há saltos para exportar.', 'error');
    const payload = {
      generatedAt: new Date().toISOString(),
      warning: 'Dados registrados manualmente. Verificar cada campo na fonte pública original.',
      hops: ledger
    };
    downloadFile('guiacrypto144-rastreio.json', JSON.stringify(payload, null, 2), 'application/json;charset=utf-8');
    setLedgerStatus('JSON gerado.', 'ok');
  }

  async function copySummary() {
    if (ledger.length === 0) return setLedgerStatus('Não há saltos para copiar.', 'error');
    const lines = ledger.map((item, index) => [
      `Salto ${index + 1} — ${item.network} — ${item.kind}`,
      `Hash/TXID: ${item.hash}`,
      `UTC: ${item.utc}`,
      `Origem: ${item.from}`,
      `Destino: ${item.to}`,
      `Ativo/valor: ${item.value} ${item.asset}`,
      `Classificação: ${item.classification}`,
      item.basis ? `Fundamento: ${item.basis}` : ''
    ].filter(Boolean).join('\n')).join('\n\n');

    try {
      await navigator.clipboard.writeText(lines);
      setLedgerStatus('Resumo copiado.', 'ok');
    } catch (_error) {
      setLedgerStatus('Não foi possível copiar automaticamente. Use a exportação JSON ou CSV.', 'error');
    }
  }

  function normalizeText(value) {
    return String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  async function loadKnowledge() {
    const status = byId('kb-status');
    try {
      const manifestResponse = await fetch(MANIFEST_PATH, { cache: 'no-store' });
      if (!manifestResponse.ok) throw new Error('Manifesto indisponível');
      const manifest = await manifestResponse.json();
      const sources = Array.isArray(manifest.sources) ? manifest.sources : [];
      knowledge.sources = sources;
      const loaded = await Promise.all(sources.map(async (source) => {
        const response = await fetch(source.path, { cache: 'no-store' });
        if (!response.ok) return null;
        const text = await response.text();
        return { id: source.id, label: source.label || source.id, text };
      }));
      knowledge.documents = loaded.filter(Boolean);
      if (status) status.textContent = `${knowledge.documents.length} base(s) local(is) carregada(s).`;
    } catch (_error) {
      if (status) {
        status.textContent = 'Base local indisponível. O restante do guia continua funcional.';
        status.classList.add('error');
      }
    }
  }

  function searchKnowledge(query) {
    const normalizedQuery = normalizeText(query).trim();
    if (normalizedQuery.length < 2) return [];
    const terms = normalizedQuery.split(/\s+/).filter(Boolean);
    const results = [];

    for (const document of knowledge.documents) {
      const lines = document.text.split(/\r?\n/);
      for (let index = 0; index < lines.length; index += 1) {
        const normalizedLine = normalizeText(lines[index]);
        const match = terms.every((term) => normalizedLine.includes(term));
        if (!match) continue;
        const excerpt = lines.slice(Math.max(0, index - 1), Math.min(lines.length, index + 3)).join('\n').trim();
        if (excerpt) results.push({ source: document.label, excerpt, line: index + 1 });
        if (results.length >= 12) return results;
      }
    }
    return results;
  }

  function handleKnowledgeSearch(event) {
    event.preventDefault();
    const query = byId('kb-query')?.value || '';
    const status = byId('kb-status');
    const target = byId('kb-results');
    if (!target || !status) return;

    if (query.trim().length < 2) {
      status.textContent = 'Digite ao menos 2 caracteres.';
      status.className = 'status-text error';
      target.innerHTML = '';
      return;
    }

    const results = searchKnowledge(query);
    status.textContent = results.length ? `${results.length} resultado(s).` : 'Nenhum resultado na base local.';
    status.className = 'status-text';
    target.innerHTML = results.map((item) => `
      <article class="kb-result">
        <h3>${escapeHtml(item.source)} · linha aproximada ${item.line}</h3>
        <p>${escapeHtml(item.excerpt)}</p>
      </article>
    `).join('');
  }

  function bindEvents() {
    const triageForm = byId('triage-form');
    const networkSelect = byId('network');
    const hopForm = byId('hop-form');
    const ledgerBody = byId('ledger-body');
    const kbForm = byId('kb-form');

    triageForm?.addEventListener('submit', handleTriage);
    triageForm?.addEventListener('reset', () => {
      const result = byId('triage-result');
      if (result) {
        result.hidden = true;
        result.innerHTML = '';
        result.classList.remove('error');
      }
      window.setTimeout(() => renderPlaybook(byId('network')?.value || 'bitcoin'), 0);
    });
    networkSelect?.addEventListener('change', () => renderPlaybook(networkSelect.value));
    hopForm?.addEventListener('submit', handleHop);
    ledgerBody?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-remove-hop]');
      if (!button) return;
      removeHop(Number(button.dataset.removeHop));
    });
    byId('clear-ledger')?.addEventListener('click', clearLedger);
    byId('export-csv')?.addEventListener('click', exportCsv);
    byId('export-json')?.addEventListener('click', exportJson);
    byId('copy-summary')?.addEventListener('click', copySummary);
    kbForm?.addEventListener('submit', handleKnowledgeSearch);
  }

  function init() {
    renderPlaybook('bitcoin');
    renderLedger();
    bindEvents();
    loadKnowledge();
  }

  document.addEventListener('DOMContentLoaded', init, { once: true });
})();
