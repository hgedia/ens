const ENS = artifacts.require("./ENSRegistry.sol");
const FIFSRegistrar = artifacts.require('./FIFSRegistrar.sol');

// Currently the parameter('./ContractName') is only used to imply
// the compiled contract JSON file name. So even though `Registrar.sol` is
// not existed, it's valid to put it here.
// TODO: align the contract name with the source code file name.
const Registrar = artifacts.require('./Registrar.sol');
const DefaultReverseResolver = artifacts.require('./DefaultReverseResolver.sol')
const ReverseRegistrar = artifacts.require('./ReverseRegistrar.sol')
const SubdomainRegistrar = artifacts.require('./SubdomainRegistrar.sol')
const PublicResolver = artifacts.require('./PublicResolver.sol')
const web3 = new (require('web3'))();
const namehash = require('eth-ens-namehash');

/**
 * Calculate root node hashes given the top level domain(tld)
 *
 * @param {string} tld plain text tld, for example: 'eth'
 */
function getRootNodeFromTLD(tld) {
  return {
    namehash: namehash(tld),
    sha3: web3.sha3(tld)
  };
}

/**
 * Deploy the ENS and FIFSRegistrar
 *
 * @param {Object} deployer truffle deployer helper
 * @param {string} tld tld which the FIFS registrar takes charge of
 */
function deployFIFSRegistrar(deployer, tld) {
  var rootNode = getRootNodeFromTLD(tld);

  // Deploy the ENS first
  deployer.deploy(ENS)
    .then(() => {
      // Deploy the FIFSRegistrar and bind it with ENS
      return deployer.deploy(FIFSRegistrar, ENS.address, rootNode.namehash);
    })
    .then(function() {
      // Transfer the owner of the `rootNode` to the FIFSRegistrar
      ENS.at(ENS.address).setSubnodeOwner('0x0', rootNode.sha3, FIFSRegistrar.address);
    });
}

/**
 * Deploy the ENS and HashRegistrar(Simplified)
 *
 * @param {Object} deployer truffle deployer helper
 * @param {string} tld tld which the Hash registrar takes charge of
 */
function deployAuctionRegistrar(deployer, tld) {
  var rootNode = getRootNodeFromTLD(tld);

  // Deploy the ENS first
  deployer.deploy(ENS)
    .then(() => {
      // Deploy the HashRegistrar and bind it with ENS
      // The last argument `0` specifies the auction start date to `now`
      return deployer.deploy(Registrar, ENS.address, rootNode.namehash, 0);
    })
    .then(function() {
      // Transfer the owner of the `rootNode` to the HashRegistrar
      ENS.at(ENS.address).setSubnodeOwner('0x0', rootNode.sha3, Registrar.address);
    });
}

function deployLivepeerENSRegistry(deployer,tld,accounts){  
  
  var rootNode = getRootNodeFromTLD(tld);

  deployer.deploy(ENS)
    .then(()=>{
    return deployer.deploy(FIFSRegistrar, ENS.address, rootNode.namehash);   
    }).then(()=>{
      return ENS.at(ENS.address).setSubnodeOwner('0x0', rootNode.sha3, FIFSRegistrar.address);
    }).then(() => {
      return deployer.deploy(DefaultReverseResolver,ENS.address)
    }).then(()=>{
      return deployer.deploy(ReverseRegistrar, ENS.address, DefaultReverseResolver.address)
    }).then(() => {
      return deployer.deploy(PublicResolver, ENS.address)
    }).then(()=>{
      return ENS.at(ENS.address).setSubnodeOwner('0x0', web3.sha3('reverse'), accounts[0]);
    }).then(()=>{
      return ENS.at(ENS.address).setSubnodeOwner(namehash('reverse'), web3.sha3('addr'), ReverseRegistrar.address);
    }).then(()=>{
      return deployer.deploy(SubdomainRegistrar, ENS.address, PublicResolver.address, namehash("livepeer.eth"), "livepeer.eth")
    }).then(() => {
      return FIFSRegistrar.at(FIFSRegistrar.address).register(web3.sha3('livepeer'), SubdomainRegistrar.address);
    }).then(()=>{
      // Deploy the ENS & setup regitrar
      console.log("=".repeat(25) + " Deployment status " + "=".repeat(25))
      console.log("Account " + accounts[0])
      console.log("ENS : " + ENS.address);
      console.log("ENS FIFS Registrar : " + FIFSRegistrar.address);
      console.log("Reverse Registrar : " + ReverseRegistrar.address);
      console.log("Default Reverse resolver  : " + DefaultReverseResolver.address);
      console.log("Livepeer Subdomain Registrar : " + SubdomainRegistrar.address);
      console.log("=".repeat(72))
    })    
}

module.exports = function(deployer, network,accounts) {
  var tld = 'eth';
  if(network ==='dev.livepeer'){
    deployLivepeerENSRegistry(deployer,tld,accounts)
  } else if (network === 'dev.fifs') {
    deployFIFSRegistrar(deployer, tld);
  }
  else if (network === 'dev.auction') {
    deployAuctionRegistrar(deployer, tld);
  }
};
