# Knowledge Base — Chain Analysis OSINT

## Sumário

1. Escopo e princípios
2. Hierarquia de fontes abertas
3. Modelo probatório e linguagem
4. Preservação e documentação
5. Bitcoin / UTXO
6. Ethereum e redes EVM
7. TRON
8. DeFi e contratos intermediários
9. Bridges e cross-chain
10. Atribuição OSINT
11. VASP/PSAV, on-ramp e off-ramp
12. Matriz de confiança
13. Templates de saída
14. Limitações e anti-padrões
15. Checklist final

---

## 1. Escopo e princípios

### 1.1 Objetivo

Chain Analysis é a reconstrução técnica de relações transacionais on-chain para responder, com rastreabilidade, perguntas como:

- de onde veio um ativo;
- para onde foi;
- qual ativo efetivamente se moveu;
- qual output/transferência representa continuidade do fluxo;
- se houve swap, bridge, consolidação, dispersão ou depósito em serviço;
- quais fontes públicas sustentam eventual atribuição;
- onde termina a evidência on-chain e começa a necessidade de diligência externa.

### 1.2 Princípio central

A blockchain mostra **relações transacionais**, não identidade civil por si só. O endereço é um identificador técnico. Atribuição exige fonte externa ou autodeclaração verificável.

### 1.3 Três camadas

**Camada 1 — dado primário**
- hash/TXID;
- bloco;
- timestamp;
- inputs/outputs;
- From/To;
- token transfers;
- logs/eventos;
- contrato;
- taxa;
- valor.

**Camada 2 — leitura analítica**
- provável troco;
- possível controle comum;
- peel chain;
- gas funding;
- provável bridge;
- provável off-ramp;
- provável serviço compartilhado.

**Camada 3 — atribuição**
- label público;
- página oficial;
- lista governamental;
- perfil Web3;
- denúncia pública;
- autodeclaração;
- resposta de provedor (fora do escopo operacional OSINT, mas possível diligência posterior).

Nunca misturar as três camadas na mesma afirmação sem qualificá-las.

---

## 2. Hierarquia de fontes abertas

### 2.1 Fonte primária on-chain

Preferir exploradores capazes de mostrar diretamente dados da rede:

**Bitcoin**
- Mempool.space;
- Blockstream Explorer;
- Blockchain.com Explorer;
- outros exploradores públicos equivalentes, com validação cruzada quando necessário.

**Ethereum/EVM**
- Etherscan e scanners específicos de cada rede;
- Blockscout quando disponível;
- explorador oficial ou reconhecido da rede.

**TRON**
- TRONSCAN.

**Bridges/DeFi**
- explorador oficial da bridge/protocolo;
- documentação pública do contrato;
- exploradores das redes de origem e destino.

### 2.2 Fontes de atribuição pública

Ordem de preferência:

1. **fonte oficial/autenticada** que publique o endereço;
2. **página oficial do serviço/protocolo**;
3. **contrato verificado** e documentação oficial;
4. **duas fontes independentes convergentes**;
5. **rótulos de exploradores**;
6. **Chainabuse e bases públicas de denúncia**;
7. **ENS, OpenSea e perfis Web3 públicos**;
8. **fóruns, GitHub, redes sociais e arquivos web**.

Resultado de buscador é pista; abrir a fonte original antes de citar.

### 2.3 Busca exata

Para endereços, usar a sequência completa entre aspas. Registrar:

- string pesquisada;
- buscador;
- data/hora;
- URL da fonte aberta;
- captura quando possível.

Busca sem resultado não prova inexistência histórica de menção.

---

## 3. Modelo probatório e linguagem

### 3.1 Estados da afirmação

**OBSERVADO**
> “A transação X, no bloco Y, transferiu Z BTC/ETH/token para o endereço A às HH:MM:SS UTC.”

**INFERIDO**
> “O output B é compatível com troco, considerando tipo de script, valor não redondo e continuidade posterior.”

**CONFIRMADO PUBLICAMENTE**
> “A página oficial da entidade X publica o endereço A como pertencente ao serviço.”

**INDETERMINADO**
> “Os sinais são conflitantes e não permitem escolher entre os outputs A e B com segurança.”

### 3.2 Linguagem recomendada

Preferir:

- “compatível com”;
- “indício de”;
- “provável”;
- “hipótese principal”;
- “hipótese alternativa”;
- “exposição a serviço rotulado como”;
- “atribuição pública segundo [fonte]”.

Evitar sem confirmação:

- “pertence ao criminoso”;
- “é a carteira do investigado”;
- “a exchange recebeu o dinheiro do autor”;
- “houve saque fiat”;
- “o funding prova controle comum”.

---

## 4. Preservação e documentação

### 4.1 Evidência mínima por salto

Registrar:

- rede;
- hash/TXID completo;
- bloco/altura;
- timestamp UTC;
- origem;
- destino ou output selecionado;
- ativo;
- contrato do token quando houver;
- valor bruto e líquido quando distinguíveis;
- taxa;
- URL/fonte;
- data/hora da consulta;
- fundamento da continuação;
- grau de confiança;
- ramos não seguidos.

### 4.2 Regra de reprodutibilidade

Outro analista deve conseguir refazer o caminho sem conversar com quem produziu o mapa.

Documentar **durante** o rastreamento, não apenas ao final.

### 4.3 Grafo versus prova

O grafo é representação visual. A evidência reside nos hashes, eventos, outputs e fontes que sustentam cada aresta.

### 4.4 Fuso horário

Usar UTC como padrão. Se houver necessidade de horário local, apresentar ambos de forma explícita e não misturar fusos.

---

## 5. Bitcoin / UTXO

### 5.1 Modelo UTXO

Uma transação Bitcoin consome outputs anteriores e cria novos outputs. O input referencia UTXO anterior e o consome integralmente.

Relação fundamental:

`taxa = soma dos inputs - soma dos outputs`

`1 BTC = 100.000.000 satoshis`

### 5.2 Ficha mínima de transação Bitcoin

- TXID;
- bloco;
- timestamp;
- inputs e UTXOs de origem;
- outputs e respectivos `vout`;
- valores;
- fee;
- sat/vB quando disponível;
- confirmações na data/hora da consulta.

### 5.3 Modelos de construção

**1 → 2 (singular)**
- um input;
- em regra, pagamento + troco.

**multi-input**
- vários inputs;
- pode indicar seleção de moedas, consolidação ou co-spend.

**multi-output / batch**
- vários destinos em uma só transação;
- comum em exchanges e processadores;
- destinatários não viram “associados” apenas por compartilhar a transação.

**1 → 1**
- gasto integral para um único output;
- pode ser transferência interna, sweep ou pagamento sem troco.

**consolidação**
- muitos inputs → poucos outputs;
- pode refletir carteira, custodiante ou serviço agregando UTXOs.

**peel chain**
- sequência em que uma parcela sai e o valor principal continua para novo endereço;
- reconhecer por linha de endereços + valor principal diminuindo progressivamente;
- não presumir finalidade criminosa apenas pelo padrão.

### 5.4 CIOH — Common Input Ownership Heuristic

Se múltiplos endereços são gastos juntos como inputs, há indício de controle coordenado/comum porque cada input precisa ser autorizado.

**Nunca aplicar cegamente.** Principais exceções:

- CoinJoin;
- PayJoin;
- exchange/custodiante gastando fundos de vários clientes;
- transações colaborativas ou serviços compartilhados.

Formulação segura:

> “Os inputs A, B e C apresentam indício de controle ou coordenação comum na transação X, ressalvadas estruturas colaborativas e custódia.”

### 5.5 Heurísticas de troco

Nenhuma regra isolada confirma troco. Testar convergência:

1. **reutilização de endereço** — output repete endereço de input;
2. **endereço novo** — candidato aparece pela primeira vez;
3. **formato/prefixo** — candidato combina com padrão da carteira;
4. **tipo de script** — P2PKH/P2SH/P2WPKH/P2TR etc.;
5. **valor** — pagamento redondo versus troco quebrado;
6. **grupo/co-spend** — comportamento posterior liga o candidato ao cluster;
7. **estrutura** — posição e padrão de construção da carteira.

Sempre produzir quadro:

| Sinal | A favor | Contra/alternativa | Peso |
|---|---|---|---|
| Valor | ... | ... | baixo/médio/alto |
| Script | ... | ... | ... |
| Endereço novo | ... | ... | ... |
| Co-spend | ... | ... | ... |

### 5.6 CoinJoin

Sinais típicos:

- múltiplos inputs independentes;
- múltiplos outputs com valores idênticos;
- ambiguidade deliberada sobre correspondência input/output.

Consequência:

- não aplicar CIOH como controle comum;
- não forçar heurística de troco;
- registrar `provável CoinJoin` e limitar a conclusão.

### 5.7 PayJoin

PayJoin pode parecer transação comum 2→2 e introduzir input do recebedor.

Consequências:

- falso positivo na CIOH;
- valor aparente pode exceder pagamento econômico real;
- ausência de outputs iguais não exclui construção colaborativa.

### 5.8 Seleção do caminho

Seguir o **output específico** que melhor representa continuidade do ativo investigado, não o “saldo do endereço”.

Se houver dois candidatos razoáveis:

- manter caminho principal;
- registrar caminho alternativo;
- explicar por que um foi priorizado;
- reduzir confiança se os sinais divergirem.

---

## 6. Ethereum e redes EVM

### 6.1 Modelo baseado em contas

Ethereum/EVM usa modelo account-based. Uma EOA pode assinar/iniciar transação; contrato executa código quando chamado.

O mesmo endereço `0x...` pode existir em várias redes. Sempre registrar a rede.

### 6.2 EOA versus contrato

**EOA**
- controlada por chave privada ou mecanismo de conta;
- inicia transação mediante assinatura/autorização;
- pode representar pessoa, bot, serviço ou carteira.

**Contrato**
- código e estado on-chain;
- normalmente executa quando chamado;
- identifica função/protocolo, não beneficiário final por si só.

Pergunta-chave:

> O endereço tomou a decisão econômica ou apenas executou/roteou a lógica de um protocolo?

### 6.3 Anatomia de transação EVM

Registrar:

- Transaction Hash;
- Status;
- Block;
- Timestamp;
- From;
- To / Interacted With;
- Value;
- Transaction Fee;
- Gas Price / Max Fee / Priority Fee quando relevante;
- método e input data quando necessário.

### 6.4 Token ERC-20

Uma transação pode ter:

`Value = 0 ETH`

mas gerar transferência de token por contrato.

Ler:

- Token Transfers;
- evento `Transfer` nos Logs;
- `from`;
- `to`;
- `value`;
- endereço do contrato emissor do evento.

**Não confundir:**

- `To/Interacted With` = contrato chamado;
- `Token Transfer To` = destinatário econômico do token.

### 6.5 Contrato legítimo do token

Confirmar sempre:

- rede;
- endereço do contrato;
- nome/símbolo;
- decimals;
- contrato verificado ou fonte oficial.

Símbolo igual não garante token igual.

### 6.6 Internal Transactions

Movimentos de moeda nativa gerados durante execução de contrato podem aparecer como internal transactions/traces. Elas são essenciais para reconstruir resultado econômico quando o `Value` inicial não mostra o fluxo completo.

### 6.7 Logs e eventos

Logs podem revelar:

- transferências;
- swaps;
- deposits/withdrawals;
- recipient;
- chain ID;
- message/deposit ID;
- parâmetros de protocolo.

Quando um campo decodificado orientar cross-chain, confirmar no destino.

### 6.8 Gas funding

O primeiro funding de moeda nativa para endereço novo pode indicar preparação de infraestrutura, mas não prova controle comum.

Classificar origem:

| Origem | Explicação possível | Verificação |
|---|---|---|
| EOA privada recorrente | vínculo operacional | histórico, outros fundings, timing |
| Exchange/custodiante | saque de cliente/serviço | rótulo público, sweep, fonte oficial |
| Faucet | financiamento automático | política/padrão do faucet |
| Bridge/relayer | continuação cross-chain | hash, message ID, origem |
| Paymaster | gas patrocinado | UserOperation, bundler, eventos |

Comparar:

`endereço inativo → funding → primeiro uso → swap/transfer/bridge`

Janelas curtas reforçam coordenação, mas não provam identidade.

---

## 7. TRON

### 7.1 Elementos essenciais

Distinguir:

- TRX = moeda nativa;
- TRC-20 = token;
- Bandwidth = recurso para bytes da transação;
- Energy = recurso associado à execução de contratos;
- staking/delegação = recursos podem vir de terceiros sem entrada TRX equivalente.

### 7.2 USDT na TRON

Confirmar:

- contrato do token;
- remetente;
- destinatário;
- valor;
- timestamp;
- fee/resource consumption;
- ativação da conta quando relevante.

### 7.3 Funding

Se não houver entrada TRX visível antes de uso de USDT, verificar:

- delegação de Energy;
- delegação de Bandwidth;
- ativação;
- recursos patrocinados.

Ausência de TRX transferido não equivale a ausência de suporte operacional.

---

## 8. DeFi e contratos intermediários

### 8.1 Regra principal

**Não parar no router.**

Reconstruir resultado econômico:

1. qual ativo saiu da EOA;
2. qual protocolo/método foi chamado;
3. quais transferências internas e eventos ocorreram;
4. qual ativo/valor líquido resultou;
5. qual endereço recebeu o resultado;
6. qual foi a operação seguinte.

### 8.2 Padrões relevantes

| Padrão | Efeito | Elemento de correlação |
|---|---|---|
| swaps sucessivos | troca rápida de ativo | valor líquido, tempo, contratos |
| agregador | múltiplos pools | calldata, logs, transfers |
| wrapped token | muda representação | contrato e relação econômica |
| LP | vira posição de liquidez | Mint/Burn/Collect, NFT/posição |
| lending | depósito/dívida/retirada | eventos e posição econômica |
| bridge | muda rede | message/deposit ID e hash destino |

### 8.3 Indicadores não são conclusão

Muitos swaps, múltiplos endereços novos, bridge rápida ou stablecoin→volátil→stablecoin podem ter explicações legítimas. Usar como perguntas investigativas, não como rótulo de lavagem.

---

## 9. Bridges e cross-chain

### 9.1 Um fluxo, dois hashes

A operação só está documentada quando origem e destino foram confirmados em suas respectivas redes.

### 9.2 Campos de correlação

- bridge/protocolo;
- hash origem;
- chain ID destino;
- recipient;
- message ID/deposit ID/nonce;
- hash destino;
- token origem;
- token destino;
- valor bruto;
- valor líquido;
- taxas/slippage;
- timestamps.

### 9.3 Ordem de validação

`explorador origem → contrato/logs → explorador oficial da bridge → explorador destino`

### 9.4 Não correlacionar só por valor

Valor pode mudar por:

- taxa;
- slippage;
- swap cross-chain;
- wrapping/unwrapping;
- liquidez;
- refund.

IDs e eventos de protocolo são mais fortes que coincidência numérica.

---

## 10. Atribuição OSINT

### 10.1 Método

`ENDEREÇO → PADRÕES → CONTEXTO → CONTINUIDADE → DILIGÊNCIA`

### 10.2 Sinais comportamentais

- reuso;
- cadência temporal;
- valores repetidos;
- sequência de testes e envio;
- mesmos contratos/routers/bridges;
- funding recorrente;
- mesmo destino de sweep;
- fingerprint técnico.

Cada sinal tem falso positivo. Valor analítico cresce quando sinais independentes convergem.

### 10.3 Fontes Web3

ENS, domínios Web3 e marketplaces de NFT podem expor:

- nickname;
- avatar;
- coleção;
- links sociais;
- endereço associado.

Limites:

- perfil autodeclarado;
- nome pode expirar/ser transferido;
- conta pode ser comprometida;
- avatar não prova identidade.

### 10.4 Chainabuse e denúncias

Tratar como pista. Registrar:

- autor/entidade;
- data;
- categoria;
- evidência citada;
- links;
- repetição em fontes independentes.

Denúncia não é prova por si só.

---

## 11. VASP/PSAV, on-ramp e off-ramp

### 11.1 Conceitos

**On-ramp:** ponto de entrada do sistema fiat para cripto.

**Off-ramp:** ponto em que cripto pode encontrar serviço capaz de conversão, custódia, pagamento ou saída para fiat.

### 11.2 Tipos de ponto de saída

- exchange custodial;
- OTC/broker;
- serviço de pagamento/cartão;
- P2P;
- ATM/cash quando aplicável.

### 11.3 Cautela essencial

Depósito em exchange/VASP **não prova saque em moeda fiduciária**.

Pode ocorrer:

- trading interno;
- transferência entre contas internas;
- saque de outro ativo;
- sweep para hot wallet;
- retenção custodial.

### 11.4 Sweep

Endereço de depósito pode mover fundos rapidamente para hot/omnibus wallet. Isso não rompe necessariamente o vínculo com a conta interna, mas a blockchain pública não revela o ledger interno do serviço.

### 11.5 Diligência externa sugerível

O agente OSINT não executa pedidos fechados, mas pode recomendar que a autoridade competente considere:

- preservação de dados;
- identificação da conta associada ao depósito;
- KYC/cadastro;
- histórico interno;
- IP/dispositivos;
- dados bancários de entrada/saída;
- contas vinculadas;
- saques subsequentes.

Sempre qualificar como diligência jurídica posterior, fora da confirmação exclusivamente on-chain.

---

## 12. Matriz de confiança

### 12.1 Heurística técnica

**Baixa**
- um único sinal;
- fonte indireta;
- padrão comum;
- alternativa forte não excluída.

**Média**
- dois ou mais sinais on-chain convergentes;
- explicações alternativas testadas;
- ausência de confirmação independente.

**Alta**
- múltiplos sinais independentes convergentes;
- confirmação pública autenticada ou correlação técnica forte e reproduzível;
- alternativas relevantes enfraquecidas.

Mesmo “alta” não deve ser traduzida automaticamente como identidade civil.

### 12.2 Matriz de atribuição

| Fonte | Achado | Natureza | Data | Risco de erro | Grau |
|---|---|---|---|---|---|
| Explorador | label do serviço | rótulo terceiro | ... | médio | baixo/médio |
| Página oficial | endereço publicado | fonte autenticada | ... | baixo | alto |
| Chainabuse | denúncia | relato | ... | alto | baixo |
| ENS/OpenSea | nickname | autodeclaração | ... | médio | médio |

---

## 13. Templates de saída

### 13.1 Ficha de anatomia — EVM

```text
Rede:
Hash:
Status:
Bloco:
UTC:
From:
To / Interacted With:
Value (moeda nativa):
Fee:
Gas Price / EIP-1559:
Token transferido:
Contrato do token:
Remetente econômico:
Destinatário econômico:
Valor do token:
Método/contrato intermediário:
Fonte:
```

### 13.2 Ficha de anatomia — Bitcoin

```text
TXID:
Bloco:
UTC:
Inputs:
Outputs:
Output investigado (vout):
Fee:
sat/vB:
Modelo: 1→2 / multi-input / multi-output / 1→1 / consolidação / peel chain
Hipótese de troco:
Sinais:
Alternativa:
Fonte:
```

### 13.3 Tabela de saltos

| # | Rede | Hash/TXID | UTC | Origem | Destino/vout | Ativo | Contrato | Valor | Fundamento | Grau | Fonte |
|---:|---|---|---|---|---|---|---|---:|---|---|---|

### 13.4 Quadro de heurística

| Sinal | Evidência | A favor | Contra/alternativa | Peso |
|---|---|---|---|---|

### 13.5 Quadro probatório

**OBSERVADO**
- ...

**INFERIDO**
- ...

**CONFIRMADO PUBLICAMENTE**
- ...

**LIMITAÇÕES**
- ...

**DILIGÊNCIAS**
- ...

### 13.6 Grafo textual

```text
[Origem conhecida]
  └─ 1,00000000 BTC → [Endereço A]
       └─ 0,98 BTC → [Endereço B]
            └─ bridge/message ID X → [Rede EVM / Endereço C]
                 └─ 0,97 token → [VASP rotulado publicamente]
```

### 13.7 Conclusão técnica curta

> Foi confirmado on-chain que [ativo/valor] percorreu [saltos]. A continuidade entre [A] e [B] é [observada/inferida] pelos elementos [x, y]. O endereço final apresenta rótulo público de [serviço], segundo [fonte], o que indica possível exposição a VASP/PSAV, sem comprovar por si só titularidade da conta ou conversão fiat. Permanecem as limitações [z].

---

## 14. Limitações e anti-padrões

### 14.1 Não fazer

- somar todos os outputs Bitcoin e chamar de “valor pago”;
- tratar endereço diferente como pessoa diferente;
- aplicar CIOH em CoinJoin/PayJoin sem ressalva;
- escolher troco por um único sinal;
- ignorar batch/consolidação custodial;
- confundir contrato de token com destinatário;
- usar `Value` da moeda nativa como valor de token;
- parar no router de DEX;
- correlacionar bridge só por valor;
- tratar label como prova;
- tratar depósito em exchange como saque fiat;
- ocultar ramo alternativo relevante;
- usar grafo sem preservar hashes/URLs;
- afirmar identidade civil com base apenas em on-chain;
- publicar segredo, seed ou dados protegidos.

### 14.2 Critério de parada

Encerrar ou marcar limite quando:

- fluxo entra em custodiante e depende de ledger interno;
- CoinJoin/PayJoin destrói a discriminação confiável;
- privacy-enhancing mechanism impede correlação reproduzível;
- bridge não fornece identificador e não há correlação robusta;
- múltiplos ramos equivalentes impedem seleção responsável;
- fonte de atribuição é fraca e não há convergência.

O limite é parte do resultado, não falha do analista.

---

## 15. Checklist final

### Evidência

- [ ] rede correta;
- [ ] hash/TXID completo;
- [ ] bloco e UTC;
- [ ] origem/destino completos;
- [ ] ativo e contrato;
- [ ] valor e taxa;
- [ ] URL/fonte e data da consulta.

### Bitcoin

- [ ] UTXO/vout seguido;
- [ ] inputs e outputs mapeados;
- [ ] troco tratado como hipótese;
- [ ] CIOH testada contra exceções;
- [ ] CoinJoin/PayJoin/custódia considerados;
- [ ] batch, consolidação ou peel chain reconhecidos quando presentes.

### EVM/TRON

- [ ] moeda nativa separada de token;
- [ ] contrato correto;
- [ ] transfers/logs/internal txs verificados;
- [ ] EOA separada de contrato intermediário;
- [ ] beneficiário econômico identificado quando possível;
- [ ] funding/resource model verificado.

### Cross-chain

- [ ] hash origem;
- [ ] rede destino;
- [ ] recipient;
- [ ] ID de correlação;
- [ ] hash destino;
- [ ] valor líquido e taxas/slippage.

### Atribuição

- [ ] label tratado como pista;
- [ ] fonte original aberta;
- [ ] data da fonte;
- [ ] convergência avaliada;
- [ ] identidade civil não extrapolada.

### Relatório

- [ ] Observado/Inferido/Confirmado separados;
- [ ] grau de confiança declarado;
- [ ] explicação alternativa registrada;
- [ ] ramos não seguidos documentados;
- [ ] limitações explícitas;
- [ ] diligências indicadas;
- [ ] análise reproduzível apenas com fontes abertas.
