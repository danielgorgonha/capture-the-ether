# Correções Aplicadas ao GuessTheRandomNumberChallenge

## Vulnerabilidade Identificada

**VULN-01**: Uso de dados públicos de blocos para aleatoriedade (block.blockhash, now)

## Correções Implementadas

### Opção 1: Commit-Reveal (GuessTheRandomNumberChallengeFixed.sol)

**Características**:
- Usa esquema commit-reveal em vez de dados de blocos
- Não requer oráculos externos
- Mais simples de implementar

**Melhorias**:
- ✅ Removido uso de block.blockhash e now
- ✅ Aleatoriedade via commit-reveal
- ✅ Delay entre commit e reveal
- ✅ Controle de estado
- ✅ Eventos para transparência
- ✅ Atualizado para Solidity 0.8.20

## Como Testar

Execute os testes de correção:
```bash
npx hardhat test challenges/05_lottery_guess_random_number/test/GuessTheRandomNumberChallengeFixed.test.js
```

## Comparação

| Aspecto | Vulnerável | Corrigido |
|---------|------------|-----------|
| Fonte de aleatoriedade | block.blockhash + now | Commit-reveal |
| Previsibilidade | 100% previsível | Não previsível até reveal |
| Dados públicos | ❌ Usa dados públicos | ✅ Não usa dados públicos |
| Delay | ❌ Nenhum | ✅ 1 dia entre commit e reveal |

