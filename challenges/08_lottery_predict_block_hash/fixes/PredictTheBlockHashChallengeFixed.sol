pragma solidity ^0.8.20;

/**
 * @title PredictTheBlockHashChallengeFixed
 * @notice Versão corrigida do PredictTheBlockHashChallenge com validação de range
 *
 * CORREÇÕES APLICADAS:
 * 1. Validação de range: Verifica que o bloco está dentro de 256 blocos
 * 2. Validação de hash: Reverte se o hash não estiver disponível
 * 3. Previne exploração: Bloqueia uso de 0x0 quando o bloco está fora do range
 * 4. Eventos: Emite eventos para transparência e auditoria
 * 5. Atualizado para Solidity 0.8.20 com proteções built-in
 */
contract PredictTheBlockHashChallengeFixed {
    address public guesser;
    bytes32 public guess;
    uint256 public settlementBlockNumber;
    uint256 public constant MAX_BLOCK_DISTANCE = 256;

    event GuessLocked(address indexed guesser, bytes32 indexed guess, uint256 settlementBlockNumber);
    event Settled(address indexed guesser, bytes32 indexed guess, bytes32 indexed answer, bool correct);

    constructor() payable {
        require(msg.value == 1 ether, "Must send 1 ether");
    }

    function isComplete() external view returns (bool) {
        return address(this).balance == 0;
    }

    function lockInGuess(bytes32 hash) external payable {
        require(guesser == address(0), "Already locked");
        require(msg.value == 1 ether, "Must send 1 ether");

        guesser = msg.sender;
        guess = hash;
        settlementBlockNumber = block.number + 1;

        emit GuessLocked(msg.sender, hash, settlementBlockNumber);
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

        address winner = guesser;
        bool correct = (guess == answer);
        
        guesser = address(0);
        
        emit Settled(winner, guess, answer, correct);

        if (correct) {
            payable(winner).transfer(2 ether);
        }
    }
}

