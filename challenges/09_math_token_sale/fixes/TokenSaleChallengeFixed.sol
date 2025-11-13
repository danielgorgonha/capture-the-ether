pragma solidity ^0.8.20;

/**
 * @title TokenSaleChallengeFixed
 * @notice Versão corrigida do TokenSaleChallenge usando Solidity 0.8.20
 *
 * CORREÇÕES APLICADAS:
 * 1. Atualizado para Solidity 0.8.20: Proteção automática contra overflow/underflow
 * 2. Validação explícita: Verifica que o pagamento está correto
 * 3. Eventos: Emite eventos para transparência e auditoria
 * 4. Safe transfers: Usa payable().transfer() de forma segura
 */
contract TokenSaleChallengeFixed {
    mapping(address => uint256) public balanceOf;
    uint256 public constant PRICE_PER_TOKEN = 1 ether;

    event TokensBought(address indexed buyer, uint256 amount, uint256 totalCost);
    event TokensSold(address indexed seller, uint256 amount, uint256 totalValue);

    constructor() payable {
        require(msg.value == 1 ether, "Must send 1 ether");
    }

    function isComplete() external view returns (bool) {
        return address(this).balance < 1 ether;
    }

    function buy(uint256 numTokens) external payable {
        // Em Solidity 0.8.20, overflow causa revert automático
        uint256 totalCost = numTokens * PRICE_PER_TOKEN;
        require(msg.value == totalCost, "Incorrect payment");

        balanceOf[msg.sender] += numTokens;
        emit TokensBought(msg.sender, numTokens, totalCost);
    }

    function sell(uint256 numTokens) external {
        require(balanceOf[msg.sender] >= numTokens, "Insufficient balance");

        balanceOf[msg.sender] -= numTokens;
        uint256 totalValue = numTokens * PRICE_PER_TOKEN;
        payable(msg.sender).transfer(totalValue);
        emit TokensSold(msg.sender, numTokens, totalValue);
    }
}

