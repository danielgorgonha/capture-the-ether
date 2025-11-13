pragma solidity ^0.4.21;

// Contrato principal que mantém os nicknames dos jogadores
contract CaptureTheEther {
    mapping (address => bytes32) public nicknameOf;

    function setNickname(bytes32 nickname) public {
        nicknameOf[msg.sender] = nickname;
    }
}

