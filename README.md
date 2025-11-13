# Capture the Ether - Desafios de Segurança em Smart Contracts

Este repositório contém soluções para os desafios de segurança em smart contracts do site [Capture the Ether](https://capturetheether.com/challenges/).

## 📋 Sobre o Projeto

Capture the Ether é uma plataforma educacional que apresenta desafios práticos de segurança em contratos inteligentes na EVM (Ethereum Virtual Machine). Cada desafio testa diferentes aspectos de segurança e vulnerabilidades comuns em Solidity.

## 🎯 Objetivo

Resolver todos os desafios do site Capture the Ether, aprendendo sobre vulnerabilidades comuns em smart contracts e como explorá-las de forma ética e educacional.

## ⚠️ Importante

- Este projeto é **apenas para fins educacionais**
- A rede Ropsten pública foi descontinuada, então simulamos localmente com `chainId: 3`
- Todos os exploits são executados em ambiente local isolado

## 📊 Status dos Desafios

### Warmup
| # | Desafio | Pontos | Status | Pasta |
|---|---------|--------|--------|-------|
| 1 | [Deploy a contract](./challenges/00_warmup_deploy_contract/) | 50 | ✅ Completo | `00_warmup_deploy_contract` |
| 2 | [Call me](./challenges/01_warmup_call_me/) | 100 | ✅ Completo | `01_warmup_call_me` |
| 3 | [Choose a nickname](./challenges/02_warmup_choose_nickname/) | 200 | ✅ Completo | `02_warmup_choose_nickname` |

### Lotteries
| # | Desafio | Pontos | Status | Pasta |
|---|---------|--------|--------|-------|
| 4 | [Guess the number](./challenges/03_lottery_guess_number/) | 200 | ✅ Completo | `03_lottery_guess_number` |
| 5 | [Guess the secret number](./challenges/04_lottery_guess_secret_number/) | 300 | ✅ Completo | `04_lottery_guess_secret_number` |
| 6 | [Guess the random number](./challenges/05_lottery_guess_random_number/) | 300 | ✅ Completo | `05_lottery_guess_random_number` |
| 7 | [Guess the new number](./challenges/06_lottery_guess_new_number/) | 400 | ✅ Completo | `06_lottery_guess_new_number` |
| 8 | [Predict the future](./challenges/07_lottery_predict_future/) | 500 | ✅ Completo | `07_lottery_predict_future` |
| 9 | [Predict the block hash](./challenges/08_lottery_predict_block_hash/) | 750 | ✅ Completo | `08_lottery_predict_block_hash` |

### Math
| # | Desafio | Pontos | Status | Pasta |
|---|---------|--------|--------|-------|
| 10 | [Token sale](./challenges/09_math_token_sale/) | 500 | ✅ Completo | `09_math_token_sale` |
| 11 | [Token whale](./challenges/10_math_token_whale/) | 500 | ✅ Completo | `10_math_token_whale` |
| 12 | [Retirement fund](./challenges/11_math_retirement_fund/) | 500 | ✅ Completo | `11_math_retirement_fund` |
| 13 | [Mapping](./challenges/12_math_mapping/) | 750 | ✅ Completo | `12_math_mapping` |
| 14 | Donation | 750 | ⏳ Pendente | - |
| 15 | Fifty years | 2000 | ⏳ Pendente | - |

### Accounts
| # | Desafio | Pontos | Status | Pasta |
|---|---------|--------|--------|-------|
| 16 | Fuzzy identity | 500 | ⏳ Pendente | - |
| 17 | Public Key | 750 | ⏳ Pendente | - |
| 18 | Account Takeover | 1500 | ⏳ Pendente | - |

### Miscellaneous
| # | Desafio | Pontos | Status | Pasta |
|---|---------|--------|--------|-------|
| 19 | Assume ownership | 300 | ⏳ Pendente | - |
| 20 | Token bank | 750 | ⏳ Pendente | - |

**Legenda:**
- ✅ Completo
- ⏳ Pendente
- 🚧 Em progresso

## 🚀 Como Começar

### Pré-requisitos

- Node.js (v16 ou superior)
- pnpm (gerenciador de pacotes)
- Git
- MetaMask (opcional, para interação visual)

### Instalação

```bash
# Instalar dependências
pnpm install

# Compilar contratos
pnpm run compile
```

### Executando Scripts

Para executar scripts de deploy e exploit, use a rede `hardhat` que está configurada com chainId 3:

```bash
# Deploy de um contrato
npx hardhat run challenges/00_warmup_deploy_contract/scripts/deploy.js --network hardhat

# Exploit de um contrato
npx hardhat run challenges/00_warmup_deploy_contract/scripts/exploit.js --network hardhat
```

**Nota:** A rede `hardhat` é uma rede in-memory que não requer nó externo rodando. Ela usa a configuração do `hardhat.config.js` com chainId 3.

### Configuração do MetaMask (Opcional)

Se você quiser usar MetaMask para interagir visualmente:

1. Inicie um nó Hardhat externo (em um terminal separado):
   ```bash
   pnpm run node
   ```

2. Importe uma conta do Hardhat Node (private key disponível nos logs do nó)

3. Adicione rede customizada no MetaMask:
   - **Nome da Rede**: `Local Hardhat`
   - **RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337` (padrão do Hardhat node) ou `3` se configurado
   - **Símbolo**: `ETH`

**Importante:** O Hardhat node padrão usa chainId 31337. Para usar chainId 3 com MetaMask, você pode usar ferramentas como Anvil (Foundry) ou configurar manualmente.

## 📚 Estrutura do Projeto

```
capture-the-ether/
├── challenges/          # Desafios organizados por categoria
│   └── 00_warmup_deploy_contract/
│       ├── contracts/   # Contratos Solidity
│       ├── scripts/     # Scripts de deploy e exploit
│       └── explanation.md
├── scripts/             # Scripts auxiliares
├── hardhat.config.js    # Configuração do Hardhat
└── README.md           # Este arquivo
```

## 📝 Como Resolver um Desafio

1. Acesse a pasta do desafio em `challenges/`
2. Leia o `explanation.md` para entender a vulnerabilidade
3. Execute o deploy: `npx hardhat run challenges/XX_desafio/scripts/deploy.js --network hardhat`
4. Execute o exploit: `npx hardhat run challenges/XX_desafio/scripts/exploit.js --network hardhat`
5. Verifique a solução no site Capture the Ether

**Exemplo para o primeiro desafio:**
```bash
npx hardhat run challenges/00_warmup_deploy_contract/scripts/deploy.js --network hardhat
```

## 🤝 Contribuindo

Veja [CONTRIBUTING.md](./CONTRIBUTING.md) para diretrizes sobre como adicionar novos desafios.

## 📄 Licença

Este projeto é apenas para fins educacionais.

## 🔗 Links Úteis

- [Capture the Ether](https://capturetheether.com/challenges/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js Documentation](https://docs.ethers.org/)

