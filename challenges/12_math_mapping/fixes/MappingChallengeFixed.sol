pragma solidity ^0.8.20;

/**
 * @title MappingChallengeFixed
 * @notice Versão corrigida do MappingChallenge usando mapping em vez de array
 *
 * CORREÇÕES APLICADAS:
 * 1. Usa mapping em vez de array dinâmico para prevenir storage collision
 * 2. Atualizado para Solidity 0.8.20 com proteções built-in
 * 3. Eventos: Emite eventos para transparência e auditoria
 */
contract MappingChallengeFixed {
    bool public isComplete;
    mapping(uint256 => uint256) public map;

    event ValueSet(uint256 indexed key, uint256 value);
    event ChallengeCompleted();

    function set(uint256 key, uint256 value) external {
        map[key] = value;
        emit ValueSet(key, value);
    }

    function get(uint256 key) external view returns (uint256) {
        return map[key];
    }

    /**
     * @notice Função para marcar o desafio como completo
     * @dev Em um contrato real, isso seria controlado por lógica de negócio
     */
    function complete() external {
        isComplete = true;
        emit ChallengeCompleted();
    }
}

