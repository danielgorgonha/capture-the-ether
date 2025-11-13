pragma solidity ^0.4.21;

// Contrato principal que mantém os nicknames dos jogadores
// Na rede Ropsten real, este contrato está em: 0x71c46Ed333C35e4E6c62D32dc7C8F00D125b4fee
contract CaptureTheEther {
    mapping (address => bytes32) public nicknameOf;

    function setNickname(bytes32 nickname) public {
        nicknameOf[msg.sender] = nickname;
    }
}

