# Correções Aplicadas ao GuessTheNumberChallenge

## Vulnerabilidade Identificada

**VULN-01**: Valor hardcoded exposto (`answer = 42`)

## Correções Implementadas

### Opção 1: Chainlink VRF (GuessTheNumberChallengeFixed.sol)

**Características**:
- Usa Chainlink VRF para aleatoriedade verdadeira
- Requer configuração de VRF Coordinator
- Mais seguro, mas requer LINK tokens

**Melhorias**:
- ✅ Removido valor hardcoded
- ✅ Aleatoriedade verdadeira via oráculo
- ✅ Controle de estado (prevent multiple guesses)
- ✅ Eventos para transparência
- ✅ Atualizado para Solidity 0.8.24

### Opção 2: Commit-Reveal (GuessTheNumberChallengeSimpleFixed.sol)

**Características**:
- Usa esquema commit-reveal para aleatoriedade
- Não requer oráculos externos
- Mais simples de implementar

**Melhorias**:
- ✅ Removido valor hardcoded
- ✅ Aleatoriedade via commit-reveal
- ✅ Delay entre commit e reveal
- ✅ Controle de estado
- ✅ Eventos para transparência
- ✅ Atualizado para Solidity 0.8.24

## Como Testar

Execute os testes de correção:
```bash
npx hardhat test challenges/03_lottery_guess_number/test/GuessTheNumberChallengeFixed.test.js
```

