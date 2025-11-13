# Correções Aplicadas ao PredictTheFutureChallenge

## Vulnerabilidades Identificadas

**VULN-01**: Aleatoriedade previsível usando dados de blocos (block.blockhash, now)
**VULN-02**: Espaço de busca pequeno (10 possibilidades)

## Correções Implementadas

### Commit-Reveal (PredictTheFutureChallengeFixed.sol)

**Características**:
- Usa esquema commit-reveal em vez de dados de blocos
- Não requer oráculos externos
- Mais simples de implementar

**Melhorias**:
- ✅ Removido uso de block.blockhash e now
- ✅ Aleatoriedade via commit-reveal
- ✅ Delay entre commit e reveal (1 dia)
- ✅ Controle de estado (previne múltiplas tentativas)
- ✅ Eventos para transparência
- ✅ Atualizado para Solidity 0.8.20

## Como Funciona

1. **Commit**: Um hash do número secreto + salt é commitado
2. **Reveal**: Após 1 dia, o número e salt são revelados e validados
3. **Lock**: Jogadores podem fazer lock após o reveal
4. **Settle**: Compara lock com número revelado

## Como Testar

Execute os testes de correção:
```bash
npx hardhat test challenges/07_lottery_predict_future/test/PredictTheFutureChallengeFixed.test.js
```

## Comparação

| Aspecto | Vulnerável | Corrigido |
|---------|------------|-----------|
| Fonte de aleatoriedade | block.blockhash + now | Commit-reveal |
| Previsibilidade | 100% previsível | Não previsível até reveal |
| Dados públicos | ❌ Usa dados públicos | ✅ Não usa dados públicos |
| Delay | ❌ Nenhum | ✅ 1 dia entre commit e reveal |
| Múltiplas tentativas | ⚠️ Permitido | ✅ Bloqueado por endereço |

