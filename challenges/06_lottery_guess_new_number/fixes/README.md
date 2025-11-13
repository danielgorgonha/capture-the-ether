# Correções Aplicadas ao GuessTheNewNumberChallenge

## Vulnerabilidade Identificada

**VULN-01**: Uso de dados públicos de blocos para aleatoriedade (block.blockhash, now)
**VULN-02**: Exploração atômica via contrato atacante

## Correções Implementadas

### Opção 1: Commit-Reveal (GuessTheNewNumberChallengeFixed.sol)

**Características**:
- Usa esquema commit-reveal em vez de dados de blocos
- Não requer oráculos externos
- Previne exploração atômica

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
npx hardhat test challenges/06_lottery_guess_new_number/test/GuessTheNewNumberChallengeFixed.test.js
```

## Comparação

| Aspecto | Vulnerável | Corrigido |
|---------|------------|-----------|
| Fonte de aleatoriedade | block.blockhash + now | Commit-reveal |
| Previsibilidade | 100% previsível | Não previsível até reveal |
| Exploração atômica | ✅ Possível | ❌ Prevenida |
| Delay | ❌ Nenhum | ✅ 1 dia entre commit e reveal |

