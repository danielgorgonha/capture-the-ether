# 🔍 **Relatório de Auditoria de Segurança: FiftyYearsChallenge**

> *"Combinação de vulnerabilidades pode ser mais perigosa do que vulnerabilidades isoladas!"*  
> — *Inspirado por Hacken: "Hackers evoluem, mas devs preparados vencem!"* 🛡️

## 📋 **Resumo Executivo**

### Informações Gerais
- **Contrato**: `FiftyYearsChallenge`
- **Versão Solidity**: `^0.4.21`
- **Data da Auditoria**: 2025
- **Categoria OWASP**: **A02 - Validação de Entradas Insuficiente** / **A05 - Gerenciamento de Segurança Insuficiente**
- **Severidade Geral**: **Alta** (Vulnerabilidade crítica)
- **Status**: ❌ **Vulnerável** (Storage collision + integer overflow)

### Visão Geral
O `FiftyYearsChallenge` é um contrato que bloqueia ether por 50 anos na primeira contribuição. A vulnerabilidade crítica está na combinação de **storage collision** e **integer overflow**. Podemos usar storage collision para modificar o `unlockTimestamp` da primeira contribuição e depois usar integer overflow para adicionar uma nova contribuição com timestamp no passado, permitindo withdraw antecipado e roubar todo o ether.

### Resumo das Vulnerabilidades
| ID | Vulnerabilidade | Severidade | Categoria OWASP | Status |
|----|----------------|------------|-----------------|--------|
| VULN-01 | Storage collision em arrays de structs | **Alta** | A02 - Validação de Entradas | ❌ Não corrigido |
| VULN-02 | Integer overflow em cálculo de timestamp | **Alta** | A02 - Validação de Entradas | ❌ Não corrigido |
| VULN-03 | Bug na função upsert (variável não inicializada) | **Média** | A05 - Gerenciamento de Segurança | ❌ Não corrigido |

**Conclusão**: Este contrato apresenta **vulnerabilidades críticas** que permitem que qualquer pessoa explore storage collision e integer overflow para roubar todo o ether antes dos 50 anos. Embora o exploit seja tecnicamente possível, o custo de gas é extremamente alto, tornando-o impraticável em produção, mas ainda demonstrando uma vulnerabilidade teórica importante.

---

## 🚨 **O que é este Desafio?**

Este é um **desafio de matemática** que demonstra como múltiplas vulnerabilidades podem ser combinadas para criar um exploit mais poderoso. O objetivo é esvaziar o contrato antes dos 50 anos, mas a vulnerabilidade permite modificar timestamps e fazer withdraw antecipado.

> 😄 *Analogia*: "É como ter um cofre com timer de 50 anos, mas você pode modificar o timer e adicionar uma nova chave que abre imediatamente!"

**Como funciona na prática?**  
- O contrato bloqueia ether por 50 anos na primeira contribuição
- A função `upsert` permite atualizar contribuições existentes ou adicionar novas
- A função `withdraw` permite retirar contribuições desbloqueadas
- O objetivo é esvaziar o contrato antes dos 50 anos
- **VULNERABILIDADE**: Storage collision + integer overflow

**Estatísticas de Impacto**: 
- **Probabilidade de sucesso do atacante**: 100% (teoricamente)
- **Custo de gas**: Extremamente alto (pode ser impraticável)
- **Facilidade de exploração**: Baixa (requer muito gas e cálculo complexo)

---

## 🛠 **Contexto Técnico: Análise do Contrato**

### **Código do Contrato**

```solidity
pragma solidity ^0.4.21;

contract FiftyYearsChallenge {
    struct Contribution {
        uint256 amount;
        uint256 unlockTimestamp;
    }
    Contribution[] queue;
    uint256 head;
    address owner;

    function FiftyYearsChallenge(address player) public payable {
        require(msg.value == 1 ether);
        owner = player;
        queue.push(Contribution(msg.value, now + 50 years));
    }

    function isComplete() public view returns (bool) {
        return address(this).balance == 0;
    }

    function upsert(uint256 index, uint256 timestamp) public payable {
        require(msg.sender == owner);

        if (index >= head && index < queue.length) {
            Contribution storage contribution = queue[index];
            contribution.amount += msg.value;
        } else {
            require(timestamp >= queue[queue.length - 1].unlockTimestamp + 1 days);
            contribution.amount = msg.value;  // ⚠️ Bug: contribution não foi inicializado!
            contribution.unlockTimestamp = timestamp;
            queue.push(contribution);
        }
    }

    function withdraw(uint256 index) public {
        require(msg.sender == owner);
        require(now >= queue[index].unlockTimestamp);

        uint256 total = 0;
        for (uint256 i = head; i <= index; i++) {
            total += queue[i].amount;
            delete queue[i];
        }
        head = index + 1;
        msg.sender.transfer(total);
    }
}
```

### **Análise Detalhada**

#### **Características do Contrato**

1. **Variáveis de Estado**:
   - `queue`: Contribution[] (slot 0 para length, elementos começam em `keccak256(0)`)
   - `head`: uint256 (slot 1)
   - `owner`: address (slot 2)

2. **Layout de Storage**:
   - **Slot 0**: `queue.length` (uint256)
   - **Slot 1**: `head` (uint256)
   - **Slot 2**: `owner` (address)
   - **Slot `keccak256(0) + 2*index`**: `queue[index].amount`
   - **Slot `keccak256(0) + 2*index + 1`**: `queue[index].unlockTimestamp`

3. **Função `upsert(uint256 index, uint256 timestamp)`**:
   - Visibilidade: `public payable`
   - Lógica: Atualiza contribuição existente ou adiciona nova
   - **VULNERABILIDADE**: Quando `index >= queue.length`, usa `contribution` não inicializado

4. **Storage Collision**:
   - O slot do campo `unlockTimestamp` do struct no índice `index` é `keccak256(0) + 2*index + 1`
   - Para sobrescrever `queue[0].unlockTimestamp` (que está em `keccak256(0) + 1`):
     - `keccak256(0) + 2*index + 1 = keccak256(0) + 1` (mod 2^256)
     - `2*index = 0` (mod 2^256)
     - `index = 0` ou `index = 2^255`

5. **Integer Overflow**:
   - Se `queue[queue.length - 1].unlockTimestamp + 1 days` fizer overflow, o resultado será pequeno
   - Podemos passar no require com um timestamp no passado

---

## 🔓 **Vulnerabilidades Encontradas**

### **VULN-01: Storage Collision em Arrays de Structs**

**Severidade**: 🔴 **Alta**

**Descrição**:  
Arrays de structs em Solidity usam `keccak256(slot)` como base para calcular o slot de seus elementos. Cada struct ocupa múltiplos slots consecutivos. O slot do campo `unlockTimestamp` do struct no índice `index` é `keccak256(0) + 2*index + 1`. Se expandirmos o array para um tamanho muito grande (2^255), podemos fazer wrap-around e sobrescrever `queue[0].unlockTimestamp`.

**Localização**:  
```solidity
function upsert(uint256 index, uint256 timestamp) public payable {
    // ...
    contribution.unlockTimestamp = timestamp;  // ⚠️ Pode sobrescrever queue[0].unlockTimestamp!
    queue.push(contribution);
}
```

**Impacto**:
- **Financeiro**: Alto - Permite modificar timestamps e fazer withdraw antecipado
- **Técnico**: Crítico - Storage collision permite sobrescrever variáveis críticas
- **Reputacional**: Alto - Lógica de negócio comprometida

**Exploração**:
1. Calcular o índice que corresponde ao slot de `queue[0].unlockTimestamp`:
   - Para sobrescrever: `keccak256(0) + 2*index + 1 = keccak256(0) + 1` (mod 2^256)
   - Isso significa: `2*index = 0` (mod 2^256)
   - Portanto: `index = 2^255`

2. Modificar `queue[0].unlockTimestamp` para causar overflow:
   - Fazer `upsert(2^255, MAX_UINT256 - 1 day)`
   - Isso sobrescreve `queue[0].unlockTimestamp` com `MAX_UINT256 - 1 day`
   - Quando fazemos `queue[0].unlockTimestamp + 1 day`, isso faz overflow (vira 0)

**Código de Exploração**:
```javascript
// Calcular índice para sobrescrever queue[0].unlockTimestamp
const index = BigInt("0x8000000000000000000000000000000000000000000000000000000000000000"); // 2^255
const MAX_UINT256 = ethers.MaxUint256;
const oneDay = BigInt(24 * 60 * 60);
const unlockTimestampForOverflow = MAX_UINT256 - oneDay + 1n;

// Modificar unlockTimestamp
await contract.upsert(index, unlockTimestampForOverflow, {
  value: ethers.parseEther("0.0001")
});
```

**Categoria OWASP**: A02 - Validação de Entradas Insuficiente

---

### **VULN-02: Integer Overflow em Cálculo de Timestamp**

**Severidade**: 🔴 **Alta**

**Descrição**:  
A função `upsert` verifica que `timestamp >= queue[queue.length - 1].unlockTimestamp + 1 days`. Em Solidity 0.4.21, não há proteção contra integer overflow. Se `queue[queue.length - 1].unlockTimestamp + 1 days` fizer overflow, o resultado será pequeno (próximo de 0), permitindo passar no require com um timestamp no passado.

**Localização**:  
```solidity
require(timestamp >= queue[queue.length - 1].unlockTimestamp + 1 days);
```

**Impacto**:
- **Financeiro**: Alto - Permite adicionar contribuições com timestamp no passado
- **Técnico**: Crítico - Integer overflow permite bypass de validação
- **Reputacional**: Alto - Lógica de negócio comprometida

**Exploração**:
1. Após modificar `queue[0].unlockTimestamp` para `MAX_UINT256 - 1 day`
2. Fazer `upsert(queue.length, 0)` ou `upsert(queue.length, timestamp_no_passado)`
3. O require `timestamp >= queue[queue.length - 1].unlockTimestamp + 1 days` passa devido ao overflow
4. Isso adiciona uma nova contribuição com timestamp no passado
5. Fazer `withdraw(1)` para retirar todo o ether

**Código de Exploração**:
```javascript
// Adicionar nova contribuição com timestamp = 0 (no passado)
await contract.upsert(await contract.queue.length(), 0, {
  value: ethers.parseEther("0.0001")
});

// Fazer withdraw antecipado
await contract.withdraw(1);
```

**Categoria OWASP**: A02 - Validação de Entradas Insuficiente

---

### **VULN-03: Bug na Função upsert (Variável Não Inicializada)**

**Severidade**: 🟡 **Média**

**Descrição**:  
Quando `index >= queue.length`, o código usa `contribution` que não foi inicializado. Em Solidity 0.4.21, variáveis de storage não inicializadas apontam para o slot 0, o que pode causar storage collision e comportamento inesperado.

**Localização**:  
```solidity
} else {
    require(timestamp >= queue[queue.length - 1].unlockTimestamp + 1 days);
    contribution.amount = msg.value;  // ⚠️ contribution não foi inicializado!
    contribution.unlockTimestamp = timestamp;
    queue.push(contribution);
}
```

**Impacto**:
- **Financeiro**: Médio - Facilita o exploit de storage collision
- **Técnico**: Médio - Comportamento inesperado
- **Reputacional**: Médio - Demonstra falta de cuidado no código

**Categoria OWASP**: A05 - Gerenciamento de Segurança Insuficiente

---

## 🎯 **Recomendações para Correção**

### **Opção 1: Usar Mapping em vez de Array (Recomendado)**

```solidity
pragma solidity ^0.8.20;

contract FiftyYearsChallengeFixed {
    struct Contribution {
        uint256 amount;
        uint256 unlockTimestamp;
    }
    mapping(uint256 => Contribution) public queue;  // ✅ Mapping não tem storage collision
    uint256 public head;
    uint256 public queueLength;
    address public owner;

    constructor(address _owner) payable {
        require(msg.value == 1 ether, "Must send 1 ether");
        owner = _owner;
        queue[0] = Contribution({
            amount: msg.value,
            unlockTimestamp: block.timestamp + 50 years
        });
        queueLength = 1;
    }

    function isComplete() external view returns (bool) {
        return address(this).balance == 0;
    }

    function upsert(uint256 index, uint256 timestamp) external payable {
        require(msg.sender == owner, "Not owner");
        
        if (index < queueLength) {
            queue[index].amount += msg.value;
        } else {
            require(
                timestamp >= queue[queueLength - 1].unlockTimestamp + 1 days,
                "Timestamp too early"
            );
            queue[queueLength] = Contribution({  // ✅ Struct inicializado corretamente
                amount: msg.value,
                unlockTimestamp: timestamp
            });
            queueLength++;
        }
    }

    function withdraw(uint256 index) external {
        require(msg.sender == owner, "Not owner");
        require(block.timestamp >= queue[index].unlockTimestamp, "Not unlocked");
        
        uint256 total = 0;
        for (uint256 i = head; i <= index; i++) {
            total += queue[i].amount;
            delete queue[i];
        }
        head = index + 1;
        payable(owner).transfer(total);
    }
}
```

**Melhorias**:
- ✅ Mappings não têm problema de storage collision
- ✅ Struct inicializado corretamente
- ✅ Solidity 0.8.20 reverte automaticamente em caso de overflow
- ✅ Mais eficiente e seguro

### **Opção 2: Validar Tamanho Máximo e Usar SafeMath**

```solidity
pragma solidity ^0.4.21;

library SafeMath {
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");
        return c;
    }
}

contract FiftyYearsChallengeFixed {
    using SafeMath for uint256;
    uint256 public constant MAX_QUEUE_SIZE = 1000;  // ✅ Limite máximo
    
    function upsert(uint256 index, uint256 timestamp) public payable {
        require(msg.sender == owner);
        require(queue.length < MAX_QUEUE_SIZE, "Queue too large");
        
        if (index >= head && index < queue.length) {
            Contribution storage contribution = queue[index];
            contribution.amount = contribution.amount.add(msg.value);
        } else {
            uint256 lastTimestamp = queue[queue.length - 1].unlockTimestamp;
            uint256 minTimestamp = lastTimestamp.add(1 days);  // ✅ SafeMath previne overflow
            require(timestamp >= minTimestamp, "Timestamp too early");
            
            Contribution memory contribution = Contribution({  // ✅ Struct inicializado
                amount: msg.value,
                unlockTimestamp: timestamp
            });
            queue.push(contribution);
        }
    }
}
```

**Melhorias**:
- ✅ Valida tamanho máximo do array
- ✅ SafeMath previne integer overflow
- ✅ Struct inicializado corretamente
- ⚠️ Ainda usa array (menos eficiente que mapping)

---

## 🔧 **Ferramentas de Análise Utilizadas**

### **Análise Estática: Slither**

**Quando usar**: Slither pode detectar uso de arrays de structs, integer overflow, e variáveis não inicializadas.

**Resultados**:
- ✅ Detecta uso de arrays de structs
- ✅ Detecta integer overflow em operações aritméticas
- ✅ Detecta variáveis não inicializadas
- ⚠️ Pode alertar sobre storage collision (se configurado)

**Comando**:
```bash
slither challenges/14_math_fifty_years/contracts/FiftyYearsChallenge.sol
```

### **Testes Hardhat**

**Estrutura de Testes**:
- `test/FiftyYearsChallenge.test.js`: Testes completos de deploy, cálculo de índice e validação

**Cobertura**:
- ✅ Deploy do contrato com 1 ether
- ✅ Verificação de estado inicial
- ✅ Cálculo do índice para storage collision
- ✅ Validação de integer overflow
- ⚠️ Execução do exploit pode falhar devido ao limite de gas

**Exemplo de Teste**:
```javascript
describe("FiftyYearsChallenge", function () {
  it("Should calculate correct index for storage collision", async function () {
    const challenge = await deploy();
    const [owner] = await ethers.getSigners();
    
    // Calcular índice para sobrescrever queue[0].unlockTimestamp
    const index = BigInt("0x8000000000000000000000000000000000000000000000000000000000000000");
    
    // Verificar que o slot calculado é correto
    const slot0Hash = ethers.keccak256(ethers.zeroPadValue("0x00", 32));
    const calculatedSlot = (BigInt(slot0Hash) + 2n * index + 1n) % (ethers.MaxUint256 + 1n);
    const targetSlot = BigInt(slot0Hash) + 1n;
    expect(calculatedSlot).to.equal(targetSlot % (ethers.MaxUint256 + 1n));
    
    // Nota: A execução real pode falhar devido ao limite de gas
  });
});
```

**Resultados**:
- ✅ Cálculo do índice está correto
- ✅ Integer overflow confirmado
- ⚠️ Execução pode falhar devido ao limite de gas
- ✅ Vulnerabilidade confirmada teoricamente

---

### **Fuzzing com Echidna**

**Quando usar**: Echidna pode ser usado para testar propriedades como "não é possível fazer withdraw antes do timestamp" ou "queue nunca excede tamanho máximo".

**Por que não usar aqui**: 
- A vulnerabilidade é clara e não requer fuzzing
- Testes Hardhat são mais adequados para este caso
- O cálculo de storage collision e overflow é determinístico

**Observação**: Em contratos corrigidos com mappings e SafeMath, Echidna pode ser útil para validar que storage collision e overflow não são possíveis.

---

## 📊 **Processo de Auditoria Aplicado**

### **Etapa 1: Pré-Análise**
- ✅ Contrato identificado: `FiftyYearsChallenge.sol`
- ✅ Versão Solidity: `^0.4.21`
- ✅ Objetivo: Identificar vulnerabilidades em contrato de bloqueio de ether com timestamps
- ✅ Ferramentas selecionadas: Slither (análise estática), Testes Hardhat (validação)

### **Etapa 2: Análise Estática**
- ✅ Revisão manual do código
- ✅ Análise de layout de storage
- ✅ Identificação de uso de arrays de structs sem validação
- ✅ Análise de integer overflow em cálculos de timestamp
- ✅ Identificação de variável não inicializada
- ✅ Verificação de padrões de vulnerabilidade conhecidos
- ✅ Execução do Slither (análise de padrões)
- ⚠️ Vulnerabilidades críticas identificadas: Storage collision, integer overflow, variável não inicializada

### **Etapa 3: Análise Dinâmica**
- ✅ Deploy do contrato em ambiente local (Hardhat)
- ✅ Cálculo do índice para storage collision
- ✅ Validação de integer overflow
- ⚠️ Tentativa de execução do exploit (pode falhar devido ao limite de gas)
- ✅ Validação teórica do exploit
- ✅ Testes unitários com Hardhat
- ✅ Confirmação de vulnerabilidade explorável (teoricamente)

### **Etapa 4: Validação**
- ✅ Vulnerabilidades confirmadas teoricamente
- ⚠️ Exploit pode ser impraticável devido ao custo de gas
- ✅ Recomendações de correção fornecidas
- ✅ Relatório completo gerado

---

## 🎯 **Conclusão: A Importância de Prevenir Múltiplas Vulnerabilidades**

O `FiftyYearsChallenge` demonstra como **múltiplas vulnerabilidades podem ser combinadas** para criar um exploit mais poderoso. Storage collision permite modificar timestamps, integer overflow permite bypass de validação, e a variável não inicializada facilita o exploit. Esta combinação permite roubar todo o ether antes dos 50 anos, demonstrando a importância de prevenir todas as vulnerabilidades, não apenas algumas.

**Principais Aprendizados**:
1. **Múltiplas vulnerabilidades são mais perigosas** - Combinações podem criar exploits poderosos
2. **Mappings são preferidos sobre arrays** - Mappings não têm problema de storage collision
3. **Integer overflow deve ser prevenido** - Use SafeMath ou Solidity 0.8.0+
4. **Variáveis devem ser inicializadas** - Sempre inicialize variáveis antes de usar
5. **Validação é essencial** - Sempre valide entradas e resultados de operações

Este desafio conclui a série de desafios de matemática, demonstrando como vulnerabilidades complexas podem ser exploradas em conjunto.

> ❓ *Pergunta Interativa*: "Como você protegeria um contrato contra múltiplas vulnerabilidades combinadas? Quais são as melhores práticas?"

---

## 🔧 **Correções Implementadas**

### **Contratos Corrigidos**

Foram criadas versões corrigidas do contrato vulnerável, implementando as recomendações de segurança:

#### **Usar Mapping (FiftyYearsChallengeFixed.sol)**

**Localização**: `fixes/FiftyYearsChallengeFixed.sol`

**Correções Aplicadas**:
1. ✅ **Substituído array por mapping**: Mappings não têm problema de storage collision
2. ✅ **Struct inicializado corretamente**: Sempre inicializa struct antes de usar
3. ✅ **Solidity 0.8.20**: Proteção automática contra overflow/underflow
4. ✅ **Validações explícitas**: Mensagens de erro claras

**Como funciona**:
- Mappings usam `keccak256(key, slot)` para calcular o slot
- Não há wrap-around possível
- Struct sempre inicializado antes de usar
- Overflow causa revert automático

**Testes de Validação**:
- ✅ Storage collision não é possível
- ✅ Integer overflow causa revert
- ✅ Operações funcionam corretamente

**Executar testes**:
```bash
npx hardhat test challenges/14_math_fifty_years/test/FiftyYearsChallengeFixed.test.js
```

### **Comparação: Vulnerável vs Corrigido**

| Aspecto | Versão Vulnerável | Versão Corrigida |
|---------|-------------------|------------------|
| **Estrutura de dados** | Array de structs | Mapping |
| **Storage collision** | ✅ Possível | ❌ Prevenida |
| **Integer overflow** | ✅ Possível | ❌ Prevenida (revert) |
| **Variável não inicializada** | ⚠️ Bug presente | ✅ Sempre inicializada |
| **Custo de gas** | ⚠️ Alto (expansão) | ✅ Baixo (O(1)) |
| **Versão Solidity** | 0.4.21 | 0.8.20 |
| **Exploração** | ✅ Possível (teoricamente) | ❌ Prevenida |

### **Validação das Correções**

**Testes Executados**:
- ✅ Storage collision não é possível
- ✅ Integer overflow causa revert
- ✅ Variáveis sempre inicializadas
- ✅ Operações funcionam corretamente

**Resultado**: ✅ **Todas as vulnerabilidades foram corrigidas**

---

## 📎 **Anexos**

### **Scripts de Deploy e Exploit**
- `scripts/deploy.js`: Script para fazer deploy do contrato
- `scripts/exploit.js`: Script para calcular índice e explorar storage collision + integer overflow

### **Testes Hardhat**
- `test/FiftyYearsChallenge.test.js`: Testes unitários do contrato vulnerável
- `test/FiftyYearsChallengeFixed.test.js`: Testes unitários do contrato corrigido
- **Executar testes vulnerável**: `npx hardhat test challenges/14_math_fifty_years/test/FiftyYearsChallenge.test.js`
- **Executar testes corrigido**: `npx hardhat test challenges/14_math_fifty_years/test/FiftyYearsChallengeFixed.test.js`

### **Contratos Corrigidos**
- `fixes/FiftyYearsChallengeFixed.sol`: Versão corrigida usando mapping
- `fixes/README.md`: Documentação das correções aplicadas

### **Referências**
- [Capture the Ether - Fifty years](https://capturetheether.com/challenges/math/fifty-years/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [Solidity 0.4.21 Documentation](https://docs.soliditylang.org/en/v0.4.21/)
- [Storage Layout in Solidity](https://docs.soliditylang.org/en/v0.4.21/miscellaneous.html#layout-of-state-variables-in-storage)
- [Integer Overflow in Solidity](https://swcregistry.io/docs/SWC-101)

