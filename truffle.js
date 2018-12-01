let mnemonic = "celery clarify connect system armor clarify gaze enable junk stock inherit dish debris expire around"
var HDWalletProvider = require("truffle-hdwallet-provider");

module.exports = {
  networks: {
    'dev.fifs': {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    },
    'dev.auction': {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    },
    'dev.livepeer':{
      provider: function () {
        return new HDWalletProvider(mnemonic, "https://rinkeby.infura.io/YmgC8ZwX9OFD8WS2tV9y")
      },
      network_id: "*",
      gasPrice: 5000000000
    }
  }
};
