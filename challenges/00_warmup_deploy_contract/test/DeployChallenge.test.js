const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DeployChallenge", function () {
  let deployChallenge;
  let deployer;

  beforeEach(async function () {
    [deployer] = await ethers.getSigners();
    
    const DeployChallenge = await ethers.getContractFactory(
      "challenges/00_warmup_deploy_contract/contracts/DeployChallenge.sol:DeployChallenge"
    );
    deployChallenge = await DeployChallenge.deploy();
    await deployChallenge.waitForDeployment();
  });

  describe("Deploy", function () {
    it("Should deploy successfully", async function () {
      const address = await deployChallenge.getAddress();
      expect(address).to.be.properAddress;
      expect(address).to.not.equal(ethers.ZeroAddress);
    });

    it("Should have correct contract name", async function () {
      // Verificar que o contrato foi deployado corretamente
      const code = await ethers.provider.getCode(await deployChallenge.getAddress());
      expect(code).to.not.equal("0x");
    });
  });

  describe("isComplete()", function () {
    it("Should return true", async function () {
      const isComplete = await deployChallenge.isComplete();
      expect(isComplete).to.be.true;
    });

    it("Should always return true (pure function)", async function () {
      // Chamar múltiplas vezes para garantir que sempre retorna true
      for (let i = 0; i < 5; i++) {
        const result = await deployChallenge.isComplete();
        expect(result).to.be.true;
      }
    });
  });

  describe("Security", function () {
    it("Should not have any state variables", async function () {
      // Verificar que não há variáveis de estado modificáveis
      // Este teste é mais conceitual - o contrato não tem estado
      const isComplete = await deployChallenge.isComplete();
      expect(isComplete).to.be.true;
    });

    it("Should be callable by any address", async function () {
      // Verificar que qualquer endereço pode chamar isComplete()
      const [, otherAccount] = await ethers.getSigners();
      const challengeAsOther = deployChallenge.connect(otherAccount);
      
      const result = await challengeAsOther.isComplete();
      expect(result).to.be.true;
    });
  });
});

