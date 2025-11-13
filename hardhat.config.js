require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.4.21",
        settings: {
          optimizer: {
            enabled: false,
            runs: 200
          }
        }
      },
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      }
    ]
  },
  networks: {
    localRopsten: {
      url: "http://127.0.0.1:8545",
      chainId: 3,
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        count: 20
      }
    }
  },
  paths: {
    sources: "./challenges",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};

