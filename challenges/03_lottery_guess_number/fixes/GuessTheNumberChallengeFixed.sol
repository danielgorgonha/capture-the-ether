pragma solidity ^0.8.20;

/**
 * @title GuessTheNumberChallengeFixed
 * @notice Versão corrigida do GuessTheNumberChallenge usando commit-reveal
 * @dev NOTA: Para produção, use Chainlink VRF. Esta é uma versão simplificada.
 * 
 * CORREÇÕES APLICADAS:
 * 1. Removido valor hardcoded (answer = 42)
 * 2. Implementado esquema commit-reveal para aleatoriedade
 * 3. Adicionado controle de estado para prevenir múltiplas tentativas
 * 4. Adicionado eventos para transparência
 * 5. Atualizado para Solidity 0.8.20 com proteções built-in
 */
contract GuessTheNumberChallengeFixed {
    bytes32 public commitment;
    uint8 public answer;
    bool public revealed;
    bool public challengeComplete;
    mapping(address => bool) public hasGuessed;
    uint256 public constant COMMIT_DURATION = 1 days;
    uint256 public revealDeadline;

    event CommitmentMade(bytes32 indexed commitment);
    event AnswerRevealed(uint8 indexed answer);
    event GuessMade(address indexed player, uint8 guess, bool correct);
    event ChallengeCompleted(address indexed winner);

    constructor() payable {
        require(msg.value == 1 ether, "Must send 1 ether");
    }

    /**
     * @notice Faz commit de um hash do número secreto
     * @param hash Hash do número secreto + salt
     */
    function commit(bytes32 hash) external {
        require(commitment == bytes32(0), "Already committed");
        commitment = hash;
        revealDeadline = block.timestamp + COMMIT_DURATION;
        emit CommitmentMade(hash);
    }

    /**
     * @notice Revela o número secreto
     * @param _answer O número secreto (0-255)
     * @param salt O salt usado no commit
     */
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
        emit AnswerRevealed(_answer);
    }

    /**
     * @notice Tenta adivinhar o número
     * @param n O número a ser adivinhado (0-255)
     */
    function guess(uint8 n) external payable {
        require(msg.value == 1 ether, "Must send 1 ether");
        require(revealed, "Answer not yet revealed");
        require(!challengeComplete, "Challenge already completed");
        require(!hasGuessed[msg.sender], "Already guessed");

        hasGuessed[msg.sender] = true;

        emit GuessMade(msg.sender, n, n == answer);

        if (n == answer) {
            challengeComplete = true;
            payable(msg.sender).transfer(2 ether);
            emit ChallengeCompleted(msg.sender);
        }
    }

    /**
     * @notice Verifica se o desafio está completo
     */
    function isComplete() external view returns (bool) {
        return challengeComplete || address(this).balance == 0;
    }
}

