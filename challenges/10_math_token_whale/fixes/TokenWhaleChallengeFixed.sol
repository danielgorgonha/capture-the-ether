pragma solidity ^0.8.20;

/**
 * @title TokenWhaleChallengeFixed
 * @notice Versão corrigida do TokenWhaleChallenge com parâmetro `from` explícito
 *
 * CORREÇÕES APLICADAS:
 * 1. Corrigido uso de msg.sender em _transfer: Agora recebe `from` como parâmetro
 * 2. Atualizado para Solidity 0.8.20: Proteção automática contra underflow
 * 3. Validações explícitas: Verifica saldos antes de transferir
 * 4. Eventos: Emite eventos para transparência e auditoria
 */
contract TokenWhaleChallengeFixed {
    address public player;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    string public name = "Simple ERC20 Token";
    string public symbol = "SET";
    uint8 public decimals = 18;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(address _player) {
        player = _player;
        totalSupply = 1000;
        balanceOf[player] = 1000;
    }

    function isComplete() external view returns (bool) {
        return balanceOf[player] >= 1000000;
    }

    /**
     * @notice Função interna de transferência corrigida
     * @param from Endereço de origem (agora explícito, não msg.sender)
     * @param to Endereço de destino
     * @param value Quantidade a transferir
     */
    function _transfer(address from, address to, uint256 value) internal {
        require(balanceOf[from] >= value, "Insufficient balance");
        require(balanceOf[to] + value >= balanceOf[to], "Overflow protection");

        balanceOf[from] -= value;
        balanceOf[to] += value;

        emit Transfer(from, to, value);
    }

    function transfer(address to, uint256 value) external {
        _transfer(msg.sender, to, value);
    }

    function approve(address spender, uint256 value) external {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
    }

    function transferFrom(address from, address to, uint256 value) external {
        require(balanceOf[from] >= value, "Insufficient balance");
        require(balanceOf[to] + value >= balanceOf[to], "Overflow protection");
        require(allowance[from][msg.sender] >= value, "Insufficient allowance");

        allowance[from][msg.sender] -= value;
        _transfer(from, to, value);
    }
}

