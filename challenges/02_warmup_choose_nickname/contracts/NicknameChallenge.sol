pragma solidity ^0.4.21;

// Importar o contrato CaptureTheEther
import "./CaptureTheEther.sol";

// Contrato de verificação do desafio
// Nota: No site real, msg.sender é o CaptureTheEther, mas para ambiente local
// vamos passar o endereço do CaptureTheEther como parâmetro
contract NicknameChallenge {
    CaptureTheEther cte;
    address player;

    // No site real: CaptureTheEther cte = CaptureTheEther(msg.sender);
    // Para ambiente local, passamos o endereço do CaptureTheEther
    function NicknameChallenge(address _player, address _cte) public {
        player = _player;
        cte = CaptureTheEther(_cte);
    }

    // Verifica que o primeiro caractere não é null
    function isComplete() public view returns (bool) {
        return cte.nicknameOf(player)[0] != 0;
    }
}

