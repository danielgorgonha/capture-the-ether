pragma solidity ^0.8.20;

/**
 * @title GuessTheSecretNumberChallengeFixed
 * @notice Versão corrigida do GuessTheSecretNumberChallenge
 * @dev Usa uint256 em vez de uint8 para aumentar o espaço de busca
 * 
 * CORREÇÕES APLICADAS:
 * 1. Alterado de uint8 para uint256 (espaço de busca muito maior)
 * 2. Adicionado rate limiting (limite de tentativas por endereço)
 * 3. Adicionado custo por tentativa (torna brute force mais caro)
 * 4. Adicionado controle de estado para prevenir múltiplas tentativas
 * 5. Adicionado eventos para transparência
 * 6. Atualizado para Solidity 0.8.20 com proteções built-in
 */
contract GuessTheSecretNumberChallengeFixed {
    bytes32 public answerHash;
    bool public challengeComplete;
    mapping(address => uint256) public attempts;
    mapping(address => uint256) public lastAttemptTime;
    uint256 public constant MAX_ATTEMPTS = 10;
    uint256 public constant COST_PER_ATTEMPT = 0.1 ether;
    uint256 public constant COOLDOWN_PERIOD = 1 hours;

    event HashSet(bytes32 indexed hash);
    event GuessMade(address indexed player, uint256 guess, bool correct);
    event ChallengeCompleted(address indexed winner);

    constructor() payable {
        require(msg.value == 1 ether, "Must send 1 ether");
    }

    /**
     * @notice Define o hash do número secreto
     * @param hash Hash do número secreto (uint256)
     * @dev Apenas pode ser definido uma vez
     */
    function setAnswerHash(bytes32 hash) external {
        require(answerHash == bytes32(0), "Hash already set");
        answerHash = hash;
        emit HashSet(hash);
    }

    /**
     * @notice Tenta adivinhar o número secreto
     * @param n O número a ser adivinhado (uint256)
     */
    function guess(uint256 n) external payable {
        require(msg.value == COST_PER_ATTEMPT, "Must send correct amount");
        require(answerHash != bytes32(0), "Answer hash not set");
        require(!challengeComplete, "Challenge already completed");
        require(attempts[msg.sender] < MAX_ATTEMPTS, "Max attempts reached");
        require(
            block.timestamp >= lastAttemptTime[msg.sender] + COOLDOWN_PERIOD || 
            lastAttemptTime[msg.sender] == 0,
            "Cooldown period not elapsed"
        );

        attempts[msg.sender]++;
        lastAttemptTime[msg.sender] = block.timestamp;

        bytes32 guessHash = keccak256(abi.encodePacked(n));
        bool correct = guessHash == answerHash;

        emit GuessMade(msg.sender, n, correct);

        if (correct) {
            challengeComplete = true;
            payable(msg.sender).transfer(address(this).balance);
            emit ChallengeCompleted(msg.sender);
        }
    }

    /**
     * @notice Verifica se o desafio está completo
     */
    function isComplete() external view returns (bool) {
        return challengeComplete || address(this).balance == 0;
    }

    /**
     * @notice Retorna informações sobre tentativas do jogador
     */
    function getPlayerInfo(address player) external view returns (
        uint256 playerAttempts,
        uint256 playerLastAttempt,
        bool canAttempt
    ) {
        playerAttempts = attempts[player];
        playerLastAttempt = lastAttemptTime[player];
        canAttempt = playerAttempts < MAX_ATTEMPTS && 
                    (block.timestamp >= playerLastAttempt + COOLDOWN_PERIOD || playerLastAttempt == 0);
    }
}

