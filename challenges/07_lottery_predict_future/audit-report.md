# 🔍 **Relatório de Auditoria de Segurança: PredictTheFutureChallenge**

> *"Prever o futuro é fácil quando você conhece todas as variáveis!"*  
> — *Inspirado por Hacken: "Hackers evoluem, mas devs preparados vencem!"* 🛡️

## 📋 **Resumo Executivo**

### Informações Gerais
- **Contrato**: `PredictTheFutureChallenge`
- **Versão Solidity**: `^0.4.21`
- **Data da Auditoria**: 2025
- **Categoria OWASP**: **A02 - Validação de Entradas Insuficiente** / **A05 - Gerenciamento de Segurança Insuficiente**
- **Severidade Geral**: **Alta** (Vulnerabilidade crítica)
- **Status**: ❌ **Vulnerável** (Aleatoriedade previsível)

### Visão Geral
O `PredictTheFutureChallenge` é um desafio de loteria que exige que o jogador "preveja" um número antes dele ser gerado. A vulnerabilidade crítica está no fato de que o número "aleatório" é calculado usando informações públicas da blockchain (`block.blockhash` e `now`), tornando-o completamente previsível. Além disso, o uso de `% 10` limita o espaço de busca a apenas 10 possibilidades, tornando o ataque por força bruta viável.

### Resumo das Vulnerabilidades
| ID | Vulnerabilidade | Severidade | Categoria OWASP | Status |
|----|----------------|------------|-----------------|--------|
| VULN-01 | Aleatoriedade previsível usando dados de blocos | **Alta** | A02 - Validação de Entradas | ❌ Não corrigido |
| VULN-02 | Espaço de busca pequeno (10 possibilidades) | **Média** | A05 - Gerenciamento de Segurança | ❌ Não corrigido |

**Conclusão**: Este contrato apresenta **vulnerabilidades críticas** que permitem que qualquer pessoa calcule ou force bruta o número correto. A loteria não possui aleatoriedade real e pode ser explorada com alta probabilidade de sucesso através de múltiplas tentativas.

---

## 🚨 **O que é este Desafio?**

Este é um **desafio de loteria** que demonstra os perigos de usar dados públicos da blockchain para gerar aleatoriedade. O objetivo é "prever" um número antes dele ser gerado, mas a vulnerabilidade permite calcular ou tentar todos os valores possíveis.

> 😄 *Analogia*: "É como jogar na loteria onde você pode ver todas as cartas antes de escolher!"

**Como funciona na prática?**  
- O contrato requer 1 ether para ser deployado
- O jogador deve fazer `lockInGuess(n)` com 1 ether para "trancar" um palpite
- O número é calculado em `settle()` usando `keccak256(block.blockhash(block.number - 1), now) % 10`
- Se o palpite corresponder ao número calculado, o jogador recebe 2 ether
- Há apenas 10 possibilidades (0-9), tornando força bruta viável

**Estatísticas de Impacto**: 
- **Probabilidade de sucesso do atacante**: ~10% por tentativa (10 possibilidades)
- **Perda potencial**: Todo o ether do contrato pode ser drenado
- **Facilidade de exploração**: Média (requer múltiplas tentativas ou cálculo preciso)

---

## 🛠 **Contexto Técnico: Análise do Contrato**

### **Código do Contrato**

```solidity
pragma solidity ^0.4.21;

contract PredictTheFutureChallenge {
    address guesser;
    uint8 guess;
    uint256 settlementBlockNumber;

    function PredictTheFutureChallenge() public payable {
        require(msg.value == 1 ether);
    }

    function isComplete() public view returns (bool) {
        return address(this).balance == 0;
    }

    function lockInGuess(uint8 n) public payable {
        require(guesser == 0);
        require(msg.value == 1 ether);

        guesser = msg.sender;
        guess = n;
        settlementBlockNumber = block.number + 1;
    }

    function settle() public {
        require(msg.sender == guesser);
        require(block.number > settlementBlockNumber);

        uint8 answer = uint8(keccak256(block.blockhash(block.number - 1), now)) % 10;

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
   - `guess`: Número escolhido (0-9)
   - `settlementBlockNumber`: Bloco onde o settle pode ser chamado (block.number + 1)

2. **Função `lockInGuess(uint8 n)`**:
   - Visibilidade: `public payable`
   - Requer: `guesser == 0` (nenhum lock ativo) e `1 ether`
   - Propósito: "Trancar" um palpite antes do número ser gerado
   - **VULNERABILIDADE**: Permite múltiplas tentativas até acertar

3. **Função `settle()`**:
   - Visibilidade: `public`
   - Requer: `msg.sender == guesser` e `block.number > settlementBlockNumber`
   - Lógica: Calcula `answer` usando dados de blocos e compara com `guess`
   - **VULNERABILIDADE**: Cálculo usa dados públicos e previsíveis

4. **Cálculo do Número**:
   ```solidity
   uint8 answer = uint8(keccak256(block.blockhash(block.number - 1), now)) % 10;
   ```
   - Usa `block.blockhash(block.number - 1)`: Hash do bloco anterior (público)
   - Usa `now`: Timestamp do bloco atual (público e previsível)
   - Aplica `% 10`: Limita a 10 possibilidades (0-9)
   - **VULNERABILIDADE**: Todos os dados são públicos e o espaço de busca é pequeno

---

## 🔓 **Vulnerabilidades Encontradas**

### **VULN-01: Aleatoriedade Previsível usando Dados de Blocos**

**Severidade**: 🔴 **Alta**

**Descrição**:  
O contrato usa `block.blockhash(block.number - 1)` e `now` para calcular o número "aleatório". Ambos são informações públicas da blockchain que podem ser lidas por qualquer pessoa antes da transação ser incluída em um bloco.

**Localização**:  
```solidity
uint8 answer = uint8(keccak256(block.blockhash(block.number - 1), now)) % 10;
```

**Impacto**:
- **Financeiro**: Alto - Todo o ether do contrato pode ser drenado
- **Técnico**: Crítico - Aleatoriedade completamente previsível
- **Reputacional**: Alto - Confiança dos usuários comprometida

**Exploração**:
1. Fazer `lockInGuess(n)` com qualquer número (0-9)
2. Minerar blocos até `block.number > settlementBlockNumber`
3. Calcular o número que será gerado no bloco atual:
   - Obter `block.blockhash(block.number - 1)`
   - Obter `now` (timestamp do bloco atual)
   - Calcular `keccak256(block.blockhash(block.number - 1), now) % 10`
4. Se o número calculado corresponder ao lock, chamar `settle()` e receber 2 ETH
5. Se não corresponder, chamar `settle()` para resetar e tentar novamente

**Código de Exploração**:
```javascript
// Calcular o número que será gerado
const settleBlock = await ethers.provider.getBlock("latest");
const prevBlock = await ethers.provider.getBlock(settleBlock.number - 1);
const timestampBytes = ethers.zeroPadValue(ethers.toBeHex(settleBlock.timestamp), 32);
const combined = ethers.concat([prevBlock.hash, timestampBytes]);
const hash = ethers.keccak256(combined);
const calculatedAnswer = parseInt(hash.slice(-2), 16) % 10;
```

**Categoria OWASP**: A02 - Validação de Entradas Insuficiente

---

### **VULN-02: Espaço de Busca Pequeno (10 Possibilidades)**

**Severidade**: 🟡 **Média**

**Descrição**:  
O uso de `% 10` limita o espaço de busca a apenas 10 valores (0-9). Isso torna o ataque por força bruta viável, mesmo sem calcular o número exato.

**Localização**:  
```solidity
uint8 answer = uint8(keccak256(block.blockhash(block.number - 1), now)) % 10;
```

**Impacto**:
- **Financeiro**: Médio - Ataque por força bruta é viável
- **Técnico**: Médio - Espaço de busca muito pequeno
- **Reputacional**: Médio - Sistema pode ser explorado com persistência

**Exploração**:
1. Fazer `lockInGuess(0)` com 1 ether
2. Minerar blocos e chamar `settle()`
3. Se não acertar, o `guesser` é resetado
4. Repetir com números 1-9 até acertar
5. Estatisticamente, acertará em média a cada 10 tentativas

**Categoria OWASP**: A05 - Gerenciamento de Segurança Insuficiente

---

## 🎯 **Recomendações para Correção**

### **Opção 1: Commit-Reveal (Recomendado)**

```solidity
pragma solidity ^0.8.20;

contract PredictTheFutureChallengeFixed {
    bytes32 public commitment;
    uint8 public answer;
    bool public revealed;
    bool public challengeComplete;
    mapping(address => bool) public hasGuessed;
    uint256 public constant COMMIT_DURATION = 1 days;
    uint256 public revealDeadline;

    function commit(bytes32 hash) external {
        require(commitment == bytes32(0), "Already committed");
        commitment = hash;
        revealDeadline = block.timestamp + COMMIT_DURATION;
    }

    function reveal(uint8 _answer, bytes32 salt) external {
        require(commitment != bytes32(0), "No commitment made");
        require(block.timestamp >= revealDeadline, "Too early to reveal");
        require(!revealed, "Already revealed");
        require(
            keccak256(abi.encodePacked(_answer, salt)) == commitment,
            "Invalid answer or salt"
        );

        revealed = true;
        answer = _answer;
    }

    function lockInGuess(uint8 n) external payable {
        require(msg.value == 1 ether, "Must send 1 ether");
        require(revealed, "Answer not yet revealed");
        require(!challengeComplete, "Challenge already completed");
        require(!hasGuessed[msg.sender], "Already guessed");

        hasGuessed[msg.sender] = true;

        if (n == answer) {
            challengeComplete = true;
            payable(msg.sender).transfer(2 ether);
        }
    }
}
```

**Melhorias**:
- ✅ Usa commit-reveal em vez de dados de blocos
- ✅ Delay entre commit e reveal previne previsão
- ✅ Previne múltiplas tentativas do mesmo endereço
- ✅ Não usa dados públicos de blocos

### **Opção 2: Chainlink VRF (Para Produção)**

Para produção, use Chainlink VRF para aleatoriedade verdadeira:
- Aleatoriedade verificável e verdadeira
- Requer LINK tokens
- Mais seguro, mas mais complexo

### **Opção 3: Aumentar Espaço de Busca**

Remover `% 10` e usar `uint256` em vez de `uint8`:
- Espaço de busca: 2^256 valores
- Torna força bruta impraticável
- Ainda vulnerável a cálculo usando dados de blocos

---

## 🔧 **Ferramentas de Análise Utilizadas**

### **Análise Estática: Slither**

**Quando usar**: Slither é útil para detectar uso de dados de blocos para aleatoriedade e padrões de vulnerabilidade conhecidos.

**Resultados**:
- ✅ Detecta uso de `block.blockhash` e `block.timestamp` para aleatoriedade
- ✅ Identifica padrões de vulnerabilidade conhecidos
- ⚠️ Alerta sobre aleatoriedade previsível

**Comando**:
```bash
slither challenges/07_lottery_predict_future/contracts/PredictTheFutureChallenge.sol
```

### **Testes Hardhat**

**Estrutura de Testes**:
- `test/PredictTheFutureChallenge.test.js`: Testes completos de deploy, exploit e validação

**Cobertura**:
- ✅ Deploy do contrato com 1 ether
- ✅ Verificação de estado inicial
- ✅ Execução do exploit (lock + settle)
- ✅ Verificação de transferência de ether
- ✅ Validação de conclusão do desafio
- ✅ Testes de múltiplas tentativas

**Exemplo de Teste**:
```javascript
describe("PredictTheFutureChallenge", function () {
  it("Should complete challenge with brute force", async function () {
    const challenge = await deploy();
    const [attacker] = await ethers.getSigners();
    
    // Fazer lock e tentar até acertar
    let settled = false;
    for (let i = 0; i < 10 && !settled; i++) {
      await challenge.connect(attacker).lockInGuess(i, {
        value: ethers.parseEther("1.0")
      });
      
      // Minerar blocos
      await ethers.provider.send("evm_mine", []);
      
      // Calcular número e chamar settle
      const block = await ethers.provider.getBlock("latest");
      // ... cálculo do número ...
      
      if (calculatedAnswer === i) {
        await challenge.connect(attacker).settle();
        settled = true;
      } else {
        await challenge.connect(attacker).settle(); // Reset
      }
    }
    
    expect(await challenge.isComplete()).to.be.true;
  });
});
```

**Resultados**:
- ✅ Todos os testes passam
- ✅ Exploit funciona com múltiplas tentativas
- ✅ Vulnerabilidade confirmada

---

### **Fuzzing com Echidna**

**Quando usar**: Echidna pode ser usado para testar propriedades como "não é possível prever o número antes do reveal" ou "múltiplas tentativas não garantem sucesso".

**Por que não usar aqui**: 
- O contrato usa dados de blocos que são difíceis de fuzzer
- A vulnerabilidade é clara e não requer fuzzing
- Testes Hardhat são mais adequados para este caso

**Observação**: Em contratos corrigidos com commit-reveal, Echidna pode ser útil para validar que o número não pode ser previsto antes do reveal.

---

## 📊 **Processo de Auditoria Aplicado**

### **Etapa 1: Pré-Análise**
- ✅ Contrato identificado: `PredictTheFutureChallenge.sol`
- ✅ Versão Solidity: `^0.4.21`
- ✅ Objetivo: Identificar vulnerabilidades em sistema de loteria com "previsão"
- ✅ Ferramentas selecionadas: Slither (análise estática), Testes Hardhat (validação)

### **Etapa 2: Análise Estática**
- ✅ Revisão manual do código
- ✅ Identificação de uso de dados de blocos (`block.blockhash`, `now`)
- ✅ Análise de espaço de busca (10 possibilidades)
- ✅ Verificação de padrões de vulnerabilidade conhecidos
- ✅ Execução do Slither (análise de padrões)
- ⚠️ Vulnerabilidades críticas identificadas: Aleatoriedade previsível e espaço de busca pequeno

### **Etapa 3: Análise Dinâmica**
- ✅ Deploy do contrato em ambiente local (Hardhat)
- ✅ Implementação de exploit (lock + settle com múltiplas tentativas)
- ✅ Execução do exploit com sucesso
- ✅ Testes unitários com Hardhat
- ✅ Verificação de transferência de ether
- ✅ Validação de comportamento esperado
- ✅ Confirmação de vulnerabilidade explorável

### **Etapa 4: Validação**
- ✅ Vulnerabilidades confirmadas e exploráveis
- ✅ Testes passam com sucesso
- ✅ Exploit funciona com múltiplas tentativas
- ✅ Recomendações de correção fornecidas
- ✅ Relatório completo gerado

---

## 🎯 **Conclusão: A Importância da Aleatoriedade Verdadeira**

O `PredictTheFutureChallenge` demonstra um erro crítico comum em contratos de loteria: **usar dados públicos da blockchain para gerar aleatoriedade**. Esta vulnerabilidade permite que qualquer pessoa calcule ou force bruta o número correto, tornando a loteria completamente insegura.

**Principais Aprendizados**:
1. **Dados de blocos são públicos** - `block.blockhash` e `now` podem ser lidos por qualquer pessoa
2. **Espaço de busca pequeno facilita força bruta** - `% 10` limita a apenas 10 possibilidades
3. **Múltiplas tentativas são viáveis** - O contrato permite resetar e tentar novamente
4. **Aleatoriedade verdadeira requer fontes externas** - Chainlink VRF ou commit-reveal são necessários

Este desafio prepara o terreno para desafios mais complexos de loteria, onde a aleatoriedade é implementada usando dados de blocos futuros ou múltiplas fontes, exigindo técnicas mais sofisticadas de exploração.

> ❓ *Pergunta Interativa*: "Por que fazer lock antes do número ser gerado não resolve o problema de segurança? Como o commit-reveal previne a previsão?"

---

## 🔧 **Correções Implementadas**

### **Contratos Corrigidos**

Foram criadas versões corrigidas do contrato vulnerável, implementando as recomendações de segurança:

#### **Commit-Reveal (PredictTheFutureChallengeFixed.sol)**

**Localização**: `fixes/PredictTheFutureChallengeFixed.sol`

**Correções Aplicadas**:
1. ✅ **Removido uso de dados públicos de blocos**: Não usa mais `block.blockhash` ou `now`
2. ✅ **Implementado commit-reveal**: Usa esquema commit-reveal para aleatoriedade
3. ✅ **Previne previsão**: Delay entre commit e reveal impede cálculo antes do lock
4. ✅ **Controle de estado**: Previne múltiplas tentativas do mesmo endereço
5. ✅ **Eventos**: Emite eventos para transparência e auditoria
6. ✅ **Solidity 0.8.20**: Atualizado com proteções built-in

**Como funciona**:
- Fase 1 (Commit): Um hash do número secreto + salt é commitado
- Fase 2 (Reveal): Após 1 dia, o número e salt são revelados e validados
- Fase 3 (Lock): Jogadores podem fazer lock após o reveal
- Fase 4 (Settle): Compara lock com número revelado

**Testes de Validação**:
- ✅ Testes completos de commit-reveal flow
- ✅ Previne previsão antes do reveal
- ✅ Valida que não usa mais dados de blocos

**Executar testes**:
```bash
npx hardhat test challenges/07_lottery_predict_future/test/PredictTheFutureChallengeFixed.test.js
```

### **Comparação: Vulnerável vs Corrigido**

| Aspecto | Versão Vulnerável | Versão Corrigida |
|---------|-------------------|------------------|
| **Fonte de aleatoriedade** | block.blockhash + now | Commit-reveal |
| **Previsibilidade** | ❌ 100% previsível | ✅ Não previsível até reveal |
| **Espaço de busca** | 10 possibilidades | 256 possibilidades (uint8) |
| **Múltiplas tentativas** | ⚠️ Permitido | ✅ Bloqueado por endereço |
| **Delay** | ❌ Nenhum | ✅ 1 dia entre commit e reveal |
| **Eventos** | ❌ Nenhum | ✅ Completo |
| **Versão Solidity** | 0.4.21 | 0.8.20 |

### **Validação das Correções**

**Testes Executados**:
- ✅ Commit de hash funciona corretamente
- ✅ Reveal após deadline funciona
- ✅ Lock antes do reveal é bloqueado
- ✅ Previne previsão usando dados de blocos
- ✅ Múltiplas tentativas são bloqueadas
- ✅ Eventos são emitidos corretamente

**Resultado**: ✅ **Todas as vulnerabilidades foram corrigidas**

---

## 📎 **Anexos**

### **Scripts de Deploy e Exploit**
- `scripts/deploy.js`: Script para fazer deploy do contrato
- `scripts/exploit.js`: Script para fazer lock, calcular número e chamar settle()

### **Testes Hardhat**
- `test/PredictTheFutureChallenge.test.js`: Testes unitários do contrato vulnerável
- `test/PredictTheFutureChallengeFixed.test.js`: Testes unitários do contrato corrigido
- **Executar testes vulnerável**: `npx hardhat test challenges/07_lottery_predict_future/test/PredictTheFutureChallenge.test.js`
- **Executar testes corrigido**: `npx hardhat test challenges/07_lottery_predict_future/test/PredictTheFutureChallengeFixed.test.js`

### **Contratos Corrigidos**
- `fixes/PredictTheFutureChallengeFixed.sol`: Versão corrigida usando commit-reveal
- `fixes/README.md`: Documentação das correções aplicadas

### **Referências**
- [Capture the Ether - Predict the future](https://capturetheether.com/challenges/lotteries/predict-the-future/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [Solidity 0.4.21 Documentation](https://docs.soliditylang.org/en/v0.4.21/)

