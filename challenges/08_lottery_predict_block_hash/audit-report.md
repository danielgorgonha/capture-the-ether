# 🔍 **Relatório de Auditoria de Segurança: PredictTheBlockHashChallenge**

> *"Limitações do EVM podem ser exploradas quando não são consideradas!"*  
> — *Inspirado por Hacken: "Hackers evoluem, mas devs preparados vencem!"* 🛡️

## 📋 **Resumo Executivo**

### Informações Gerais
- **Contrato**: `PredictTheBlockHashChallenge`
- **Versão Solidity**: `^0.4.21`
- **Data da Auditoria**: 2025
- **Categoria OWASP**: **A02 - Validação de Entradas Insuficiente** / **A05 - Gerenciamento de Segurança Insuficiente**
- **Severidade Geral**: **Alta** (Vulnerabilidade crítica)
- **Status**: ❌ **Vulnerável** (Limitação do EVM explorável)

### Visão Geral
O `PredictTheBlockHashChallenge` é um desafio de loteria que exige que o jogador "preveja" o hash de um bloco futuro. A vulnerabilidade crítica está no fato de que `block.blockhash()` em Solidity só funciona para os últimos 256 blocos. Para blocos mais antigos, a função retorna `0x0`, permitindo que um atacante faça lock com `0x0` e espere mais de 256 blocos para garantir que o hash seja `0x0`.

### Resumo das Vulnerabilidades
| ID | Vulnerabilidade | Severidade | Categoria OWASP | Status |
|----|----------------|------------|-----------------|--------|
| VULN-01 | Limitação do `block.blockhash()` explorável | **Alta** | A02 - Validação de Entradas | ❌ Não corrigido |

**Conclusão**: Este contrato apresenta uma **vulnerabilidade crítica** que explora uma limitação conhecida do EVM. O hash de blocos antigos (mais de 256 blocos) retorna `0x0`, permitindo que qualquer pessoa explore o contrato com 100% de sucesso após esperar o tempo necessário.

---

## 🚨 **O que é este Desafio?**

Este é um **desafio de loteria** que demonstra os perigos de não considerar limitações do EVM ao usar `block.blockhash()`. O objetivo é "prever" o hash de um bloco futuro, mas a vulnerabilidade permite explorar a limitação de que hashes de blocos antigos retornam `0x0`.

> 😄 *Analogia*: "É como apostar no resultado de um jogo que já aconteceu, mas ninguém lembra o resultado!"

**Como funciona na prática?**  
- O contrato requer 1 ether para ser deployado
- O jogador deve fazer `lockInGuess(hash)` com 1 ether para "trancar" um palpite de hash
- O hash é verificado em `settle()` usando `block.blockhash(settlementBlockNumber)`
- Se o palpite corresponder ao hash, o jogador recebe 2 ether
- **VULNERABILIDADE**: `block.blockhash()` retorna `0x0` para blocos com mais de 256 blocos de distância

**Estatísticas de Impacto**: 
- **Probabilidade de sucesso do atacante**: 100% (após esperar 256+ blocos)
- **Perda potencial**: Todo o ether do contrato pode ser drenado
- **Facilidade de exploração**: Média (requer esperar 256+ blocos)

---

## 🛠 **Contexto Técnico: Análise do Contrato**

### **Código do Contrato**

```solidity
pragma solidity ^0.4.21;

contract PredictTheBlockHashChallenge {
    address guesser;
    bytes32 guess;
    uint256 settlementBlockNumber;

    function PredictTheBlockHashChallenge() public payable {
        require(msg.value == 1 ether);
    }

    function isComplete() public view returns (bool) {
        return address(this).balance == 0;
    }

    function lockInGuess(bytes32 hash) public payable {
        require(guesser == 0);
        require(msg.value == 1 ether);

        guesser = msg.sender;
        guess = hash;
        settlementBlockNumber = block.number + 1;
    }

    function settle() public {
        require(msg.sender == guesser);
        require(block.number > settlementBlockNumber);

        bytes32 answer = block.blockhash(settlementBlockNumber);

        guesser = 0;
        if (guess == answer) {
            msg.sender.transfer(2 ether);
        }
    }
}
```

### **Análise Detalhada**

#### **Características do Contrato**

1. **Variáveis de Estado**:
   - `guesser`: Endereço que fez o lock (apenas um por vez)
   - `guess`: Hash escolhido (bytes32)
   - `settlementBlockNumber`: Bloco onde o hash será verificado (block.number + 1)

2. **Função `lockInGuess(bytes32 hash)`**:
   - Visibilidade: `public payable`
   - Requer: `guesser == 0` (nenhum lock ativo) e `1 ether`
   - Propósito: "Trancar" um palpite de hash antes do bloco ser minerado
   - **VULNERABILIDADE**: Permite fazer lock com `0x0`

3. **Função `settle()`**:
   - Visibilidade: `public`
   - Requer: `msg.sender == guesser` e `block.number > settlementBlockNumber`
   - Lógica: Verifica `block.blockhash(settlementBlockNumber)` e compara com `guess`
   - **VULNERABILIDADE**: `block.blockhash()` retorna `0x0` para blocos antigos

4. **Limitação do EVM**:
   ```solidity
   bytes32 answer = block.blockhash(settlementBlockNumber);
   ```
   - `block.blockhash(n)` só funciona para `n` nos últimos 256 blocos
   - Para blocos mais antigos, retorna `0x0000000000000000000000000000000000000000000000000000000000000000`
   - **VULNERABILIDADE**: Se `block.number - settlementBlockNumber > 256`, `answer` será `0x0`

---

## 🔓 **Vulnerabilidades Encontradas**

### **VULN-01: Limitação do `block.blockhash()` Explorável**

**Severidade**: 🔴 **Alta**

**Descrição**:  
O contrato usa `block.blockhash(settlementBlockNumber)` para verificar o hash do bloco. No entanto, `block.blockhash()` em Solidity só funciona para os últimos 256 blocos. Para blocos mais antigos (mais de 256 blocos de distância), a função retorna `0x0`. Um atacante pode fazer lock com `0x0` e esperar mais de 256 blocos após o `settlementBlockNumber` para garantir que o hash seja `0x0`.

**Localização**:  
```solidity
bytes32 answer = block.blockhash(settlementBlockNumber);
```

**Impacto**:
- **Financeiro**: Alto - Todo o ether do contrato pode ser drenado
- **Técnico**: Crítico - Limitação do EVM explorável
- **Reputacional**: Alto - Confiança dos usuários comprometida

**Exploração**:
1. Fazer `lockInGuess(0x0)` com 1 ether (bytes32 zero)
2. Esperar mais de 256 blocos após o `settlementBlockNumber`
3. Chamar `settle()`
4. Como `block.number - settlementBlockNumber > 256`, `block.blockhash(settlementBlockNumber)` retorna `0x0`
5. O `guess` (`0x0`) corresponde ao `answer` (`0x0`)
6. Receber 2 ether de volta

**Código de Exploração**:
```javascript
// Fazer lock com 0x0
await challenge.lockInGuess(ethers.ZeroHash, {
  value: ethers.parseEther("1.0")
});

// Esperar mais de 256 blocos
for (let i = 0; i < 257; i++) {
  await ethers.provider.send("evm_mine", []);
}

// Chamar settle() - block.blockhash() retornará 0x0
await challenge.settle();
```

**Por que funciona?**:
- `block.blockhash(n)` só funciona para `n` nos últimos 256 blocos
- Se `block.number - n > 256`, retorna `0x0`
- Ao fazer lock com `0x0` e esperar 256+ blocos, garantimos que `answer` será `0x0`

**Categoria OWASP**: A02 - Validação de Entradas Insuficiente

---

## 🎯 **Recomendações para Correção**

### **Opção 1: Validar que o Bloco está Dentro do Range (Recomendado)**

```solidity
pragma solidity ^0.8.20;

contract PredictTheBlockHashChallengeFixed {
    address guesser;
    bytes32 guess;
    uint256 settlementBlockNumber;
    uint256 public constant MAX_BLOCK_DISTANCE = 256;

    function lockInGuess(bytes32 hash) external payable {
        require(guesser == address(0), "Already locked");
        require(msg.value == 1 ether, "Must send 1 ether");

        guesser = msg.sender;
        guess = hash;
        settlementBlockNumber = block.number + 1;
    }

    function settle() external {
        require(msg.sender == guesser, "Not the guesser");
        require(block.number > settlementBlockNumber, "Too early");
        require(
            block.number - settlementBlockNumber <= MAX_BLOCK_DISTANCE,
            "Block too old - hash unavailable"
        );

        bytes32 answer = blockhash(settlementBlockNumber);
        require(answer != bytes32(0), "Block hash unavailable");

        guesser = address(0);
        if (guess == answer) {
            payable(msg.sender).transfer(2 ether);
        }
    }
}
```

**Melhorias**:
- ✅ Valida que o bloco está dentro do range de 256 blocos
- ✅ Reverte se o hash não estiver disponível
- ✅ Previne exploração da limitação do EVM

### **Opção 2: Usar Commit-Reveal**

Usar esquema commit-reveal em vez de `block.blockhash()`:
- Não depende de limitações do EVM
- Mais seguro, mas mais complexo
- Requer delay entre commit e reveal

### **Opção 3: Usar Chainlink VRF**

Para produção, use Chainlink VRF para aleatoriedade verdadeira:
- Não depende de dados de blocos
- Aleatoriedade verificável e verdadeira
- Requer LINK tokens

---

## 🔧 **Ferramentas de Análise Utilizadas**

### **Análise Estática: Slither**

**Quando usar**: Slither pode detectar uso de `block.blockhash()` e alertar sobre limitações conhecidas.

**Resultados**:
- ✅ Detecta uso de `block.blockhash()`
- ⚠️ Alerta sobre limitação de 256 blocos (se configurado)
- ⚠️ Identifica padrões de vulnerabilidade conhecidos

**Comando**:
```bash
slither challenges/08_lottery_predict_block_hash/contracts/PredictTheBlockHashChallenge.sol
```

### **Testes Hardhat**

**Estrutura de Testes**:
- `test/PredictTheBlockHashChallenge.test.js`: Testes completos de deploy, exploit e validação

**Cobertura**:
- ✅ Deploy do contrato com 1 ether
- ✅ Verificação de estado inicial
- ✅ Execução do exploit (lock com 0x0 + esperar 256+ blocos)
- ✅ Verificação de transferência de ether
- ✅ Validação de conclusão do desafio
- ✅ Testes de limitação do block.blockhash()

**Exemplo de Teste**:
```javascript
describe("PredictTheBlockHashChallenge", function () {
  it("Should complete challenge by exploiting block.blockhash limitation", async function () {
    const challenge = await deploy();
    const [attacker] = await ethers.getSigners();
    
    // Fazer lock com 0x0
    await challenge.connect(attacker).lockInGuess(ethers.ZeroHash, {
      value: ethers.parseEther("1.0")
    });
    
    // Esperar mais de 256 blocos
    for (let i = 0; i < 257; i++) {
      await ethers.provider.send("evm_mine", []);
    }
    
    // Chamar settle() - block.blockhash() retornará 0x0
    await challenge.connect(attacker).settle();
    
    expect(await challenge.isComplete()).to.be.true;
  });
});
```

**Resultados**:
- ✅ Todos os testes passam
- ✅ Exploit funciona com 100% de sucesso após 256+ blocos
- ✅ Vulnerabilidade confirmada

---

### **Fuzzing com Echidna**

**Quando usar**: Echidna pode ser usado para testar propriedades como "não é possível prever o hash de blocos futuros" ou "block.blockhash() sempre retorna valor válido".

**Por que não usar aqui**: 
- A vulnerabilidade é clara e não requer fuzzing
- Testes Hardhat são mais adequados para este caso
- A limitação do EVM é conhecida e documentada

**Observação**: Em contratos corrigidos com validação de range, Echidna pode ser útil para validar que o contrato reverte quando o bloco está fora do range.

---

## 📊 **Processo de Auditoria Aplicado**

### **Etapa 1: Pré-Análise**
- ✅ Contrato identificado: `PredictTheBlockHashChallenge.sol`
- ✅ Versão Solidity: `^0.4.21`
- ✅ Objetivo: Identificar vulnerabilidades em sistema de loteria com previsão de hash de blocos
- ✅ Ferramentas selecionadas: Slither (análise estática), Testes Hardhat (validação)

### **Etapa 2: Análise Estática**
- ✅ Revisão manual do código
- ✅ Identificação de uso de `block.blockhash()`
- ✅ Análise de limitação conhecida do EVM (256 blocos)
- ✅ Verificação de padrões de vulnerabilidade conhecidos
- ✅ Execução do Slither (análise de padrões)
- ⚠️ Vulnerabilidade crítica identificada: Limitação do `block.blockhash()` explorável

### **Etapa 3: Análise Dinâmica**
- ✅ Deploy do contrato em ambiente local (Hardhat)
- ✅ Implementação de exploit (lock com 0x0 + esperar 256+ blocos)
- ✅ Execução do exploit com sucesso
- ✅ Testes unitários com Hardhat
- ✅ Verificação de transferência de ether
- ✅ Validação de comportamento esperado
- ✅ Confirmação de vulnerabilidade explorável

### **Etapa 4: Validação**
- ✅ Vulnerabilidade confirmada e explorável
- ✅ Testes passam com sucesso
- ✅ Exploit funciona com 100% de sucesso após 256+ blocos
- ✅ Recomendações de correção fornecidas
- ✅ Relatório completo gerado

---

## 🎯 **Conclusão: A Importância de Conhecer Limitações do EVM**

O `PredictTheBlockHashChallenge` demonstra um erro crítico comum em contratos: **não considerar limitações conhecidas do EVM**. A função `block.blockhash()` tem uma limitação documentada (só funciona para os últimos 256 blocos), mas o contrato não valida isso, permitindo exploração.

**Principais Aprendizados**:
1. **Limitações do EVM são conhecidas** - `block.blockhash()` só funciona para 256 blocos
2. **Validação é essencial** - Sempre validar que dados estão disponíveis
3. **Documentação é importante** - Limitações devem ser consideradas no design
4. **Testes devem cobrir edge cases** - Limitações conhecidas devem ser testadas

Este desafio prepara o terreno para desafios mais complexos, onde múltiplas limitações e vulnerabilidades são combinadas para criar exploits sofisticados.

> ❓ *Pergunta Interativa*: "Quais outras limitações do EVM você conhece que poderiam ser exploradas em contratos vulneráveis?"

---

## 🔧 **Correções Implementadas**

### **Contratos Corrigidos**

Foram criadas versões corrigidas do contrato vulnerável, implementando as recomendações de segurança:

#### **Validação de Range (PredictTheBlockHashChallengeFixed.sol)**

**Localização**: `fixes/PredictTheBlockHashChallengeFixed.sol`

**Correções Aplicadas**:
1. ✅ **Validação de range**: Verifica que o bloco está dentro de 256 blocos
2. ✅ **Validação de hash**: Reverte se o hash não estiver disponível
3. ✅ **Previne exploração**: Bloqueia uso de `0x0` quando o bloco está fora do range
4. ✅ **Eventos**: Emite eventos para transparência e auditoria
5. ✅ **Solidity 0.8.20**: Atualizado com proteções built-in

**Como funciona**:
- Fase 1 (Lock): Jogador faz lock com um hash
- Fase 2 (Settle): Valida que o bloco está dentro do range de 256 blocos
- Fase 3 (Verificação): Compara hash do lock com hash do bloco (se disponível)

**Testes de Validação**:
- ✅ Validação de range funciona corretamente
- ✅ Reverte quando bloco está fora do range
- ✅ Previne exploração da limitação do EVM

**Executar testes**:
```bash
npx hardhat test challenges/08_lottery_predict_block_hash/test/PredictTheBlockHashChallengeFixed.test.js
```

### **Comparação: Vulnerável vs Corrigido**

| Aspecto | Versão Vulnerável | Versão Corrigida |
|---------|-------------------|------------------|
| **Validação de range** | ❌ Nenhuma | ✅ Valida 256 blocos |
| **Validação de hash** | ❌ Nenhuma | ✅ Reverte se hash = 0x0 |
| **Exploração de limitação** | ✅ Possível | ❌ Prevenida |
| **Eventos** | ❌ Nenhum | ✅ Completo |
| **Versão Solidity** | 0.4.21 | 0.8.20 |

### **Validação das Correções**

**Testes Executados**:
- ✅ Validação de range funciona corretamente
- ✅ Reverte quando bloco está fora do range
- ✅ Previne exploração usando 0x0
- ✅ Eventos são emitidos corretamente

**Resultado**: ✅ **Todas as vulnerabilidades foram corrigidas**

---

## 📎 **Anexos**

### **Scripts de Deploy e Exploit**
- `scripts/deploy.js`: Script para fazer deploy do contrato
- `scripts/exploit.js`: Script para fazer lock com 0x0, esperar 256+ blocos e chamar settle()

### **Testes Hardhat**
- `test/PredictTheBlockHashChallenge.test.js`: Testes unitários do contrato vulnerável
- `test/PredictTheBlockHashChallengeFixed.test.js`: Testes unitários do contrato corrigido
- **Executar testes vulnerável**: `npx hardhat test challenges/08_lottery_predict_block_hash/test/PredictTheBlockHashChallenge.test.js`
- **Executar testes corrigido**: `npx hardhat test challenges/08_lottery_predict_block_hash/test/PredictTheBlockHashChallengeFixed.test.js`

### **Contratos Corrigidos**
- `fixes/PredictTheBlockHashChallengeFixed.sol`: Versão corrigida com validação de range
- `fixes/README.md`: Documentação das correções aplicadas

### **Referências**
- [Capture the Ether - Predict the block hash](https://capturetheether.com/challenges/lotteries/predict-the-block-hash/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [Solidity 0.4.21 Documentation](https://docs.soliditylang.org/en/v0.4.21/)
- [EVM Opcodes - BLOCKHASH](https://ethereum.org/en/developers/docs/evm/opcodes/)

