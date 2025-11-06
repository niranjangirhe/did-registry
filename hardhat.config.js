require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    watr: {
      url: "https://rpc.testnet.watr.org/XQaJWUCOGOXaPJOt4ros/ext/bc/2ZZiR6T2sJjebQguABb53rRpzme8zfK4R9zt5vMM8MX1oUm3g/rpc",
      chainId: 92870,
      accounts: process.env.WATR_PRIVATE_KEY ? [process.env.WATR_PRIVATE_KEY] : [],
    },
  },
};
