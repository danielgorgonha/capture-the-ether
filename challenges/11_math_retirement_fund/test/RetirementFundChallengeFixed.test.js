const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RetirementFundChallengeFixed", function () {
  let challenge;
  let deployer;
  let player;
  let attacker;

  beforeEach(async function () {
    [deployer, player, attacker] = await ethers.getSigners();
    
    const RetirementFundChallengeFixed = await ethers.getContractFactory(
      "challenges/11_math_retirement_fund/fixes/RetirementFundChallengeFixed.sol:RetirementFundChallengeFixed"
    );
    
    challenge = await RetirementFundChallengeFixed.deploy(player.address, {
      value: ethers.parseEther("1.0")
    });
    await challenge.waitForDeployment();
  });

  describe("Deploy", function () {
    it("Should deploy successfully with 1 ether", async function () {
      const address = await challenge.getAddress();
      expect(address).to.be.properAddress;
      
      const balance = await ethers.provider.getBalance(address);
      expect(balance).to.equal(ethers.parseEther("1.0"));
      
      expect(await challenge.startBalance()).to.equal(ethers.parseEther("1.0"));
      expect(await challenge.beneficiary()).to.equal(player.address);
    });

    it("Should start with challenge incomplete", async function () {
      expect(await challenge.isComplete()).to.be.false;
    });
  });

  describe("Withdraw Function", function () {
    it("Should allow owner to withdraw", async function () {
      const balanceBefore = await ethers.provider.getBalance(deployer.address);
      
      const tx = await challenge.connect(deployer).withdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(deployer.address);
      
      // Deve receber 90% (early withdrawal penalty)
      expect(balanceAfter).to.be.greaterThan(balanceBefore - gasUsed + ethers.parseEther("0.9") - ethers.parseEther("0.01"));
    });

    it("Should revert if not owner", async function () {
      await expect(
        challenge.connect(player).withdraw()
      ).to.be.revertedWith("Not owner");
    });
  });

  describe("CollectPenalty Function", function () {
    it("Should allow beneficiary to collect penalty after early withdrawal", async function () {
      // Owner faz early withdrawal
      await challenge.connect(deployer).withdraw();
      
      // Beneficiary coleta penalty
      const balanceBefore = await ethers.provider.getBalance(player.address);
      
      const tx = await challenge.connect(player).collectPenalty();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(player.address);
      
      expect(await challenge.isComplete()).to.be.true;
      expect(balanceAfter).to.be.greaterThan(balanceBefore - gasUsed);
    });

    it("Should revert if not beneficiary", async function () {
      await expect(
        challenge.connect(attacker).collectPenalty()
      ).to.be.revertedWith("Not beneficiary");
    });

    it("Should revert if no early withdrawal occurred", async function () {
      // Sem early withdrawal, não há penalty
      await expect(
        challenge.connect(player).collectPenalty()
      ).to.be.revertedWith("No early withdrawal");
    });
  });

  describe("Security Improvements", function () {
    it("Should prevent exploitation via selfdestruct", async function () {
      // Criar um contrato atacante que força ether via selfdestruct
      const Attacker = await ethers.getContractFactory(
        "challenges/11_math_retirement_fund/contracts/Attacker.sol:Attacker"
      );
      const attackerContract = await Attacker.deploy();
      await attackerContract.waitForDeployment();
      
      // Enviar ether para o contrato atacante
      await attacker.sendTransaction({
        to: await attackerContract.getAddress(),
        value: ethers.parseEther("0.1")
      });
      
      // Tentar forçar ether no contrato via selfdestruct
      await attackerContract.attack(await challenge.getAddress());
      
      // Verificar que o balance aumentou
      const balance = await ethers.provider.getBalance(await challenge.getAddress());
      expect(balance).to.be.greaterThan(ethers.parseEther("1.0"));
      
      // Tentar coletar penalty deve reverter porque balance > startBalance
      await expect(
        challenge.connect(player).collectPenalty()
      ).to.be.revertedWith("Balance cannot exceed startBalance");
    });

    it("Should prevent integer underflow", async function () {
      // Se balance > startBalance, o cálculo startBalance - balance causaria underflow
      // Mas a validação previne isso
      const Attacker = await ethers.getContractFactory(
        "challenges/11_math_retirement_fund/contracts/Attacker.sol:Attacker"
      );
      const attackerContract = await Attacker.deploy();
      await attackerContract.waitForDeployment();
      
      await attacker.sendTransaction({
        to: await attackerContract.getAddress(),
        value: ethers.parseEther("0.1")
      });
      
      await attackerContract.attack(await challenge.getAddress());
      
      // Deve reverter antes de fazer o cálculo
      await expect(
        challenge.connect(player).collectPenalty()
      ).to.be.revertedWith("Balance cannot exceed startBalance");
    });
  });
});

