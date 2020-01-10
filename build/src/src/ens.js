const Eth = require("ethjs");
const decodeContent = require("./utils/decodeContent");
const decodeContentHash = require("./utils/decodeContentHash");
const computeNode = require("./utils/computeNode");
const getInstalledEthNode = require("./utils/getInstalledEthNode");

/**
 * ENS parameters
 * Last updated January 2019
 */
const ensAddr = "0x314159265dd8dbb310642f98f50c066173c1259b";
const ensAbi = require("./abi/ens.json");
const resolverAbi = require("./abi/resolverAbi.json");

const ethProvider =
  process.env.WEB3HOSTHTTP || "http://my.ethchain.dnp.dappnode.eth:8545";

const TEXT_INTERFACE_ID = "0x59d1d43c";
const CONTENTHASH_INTERFACE_ID = "0xbc1c58d1";
const CONTENT_INTERFACE_ID = "0xd8389dc5";
const interfaces = [
  TEXT_INTERFACE_ID,
  CONTENTHASH_INTERFACE_ID,
  CONTENT_INTERFACE_ID
];


let eth,ens,Resolver;

// const eth = new Eth(new Eth.HttpProvider(ethProvider));
// console.log("Connected web3 to " + ethProvider);

// // Cache ENS contract instance
// const ens = eth.contract(ensAbi).at(ensAddr);
// const Resolver = eth.contract(resolverAbi);

/**
 * Resolves a request for an ENS domain iterating over various methods
 *
 * @param {string} name
 * @returns {string} content
 * - "0x"
 * - "0x404"
 * - "/ipfs/Qm..."
 */
async function getContent(name) {
  console.log("Requested: " + name);

  if(!eth){

    const endpoint = await getInstalledEthNode();
    eth = new Eth(new Eth.HttpProvider(endpoint));
    console.log("Connected web3 to " + ethProvider);
    
    // Cache ENS contract instance
    ens = eth.contract(ensAbi).at(ensAddr);
    Resolver = eth.contract(resolverAbi);
    
  }



  try {
    if (!(await isListening())) throw Error("Network is not listening");

    const node = computeNode(name);
    const resolverAddress = await ens.resolver(node).then(res => res[0]);
    if (parseInt(resolverAddress) === 0) return "0x404";

    const resolver = Resolver.at(resolverAddress);
    const interfacesAvailable = await getInterfacesAvailable(resolver);

    /**
     * `contentHash` method
     */
    if (interfacesAvailable[CONTENTHASH_INTERFACE_ID]) {
      const contentHashEncoded = await resolver
        .contenthash(node)
        .then(res => res[0]);
      const content = decodeContentHash(contentHashEncoded);
      if (content) return content;
    }

    /**
     * `text` method
     * This method is deprecated, but it is preserved for compatibility
     */
    if (interfacesAvailable[TEXT_INTERFACE_ID]) {
      const content = await resolver.text(node, "dnslink").then(res => res[0]);
      if ((content || "").startsWith("/ipfs/")) return content;
    }

    /**
     * `content` method
     */
    if (interfacesAvailable[CONTENT_INTERFACE_ID]) {
      const contentEncoded = await resolver.content(node).then(res => res[0]);
      const content = decodeContent(contentEncoded);
      if (content) return content;
    }

    return "0x404";
  } catch (e) {
    console.error(e.stack);
    return "0x";
  }
}

// Utils

/**
 * Iterates over various interfaces to check if they are available
 *
 * @param {object} resolver ethjs contract instance
 * @returns {object} interfacesAvailable = {
 *   TEXT_INTERFACE_ID: true,
 *   CONTENTHASH_INTERFACE_ID: false,
 * }
 */
async function getInterfacesAvailable(resolver) {
  const interfacesAvailable = {};
  await Promise.all(
    interfaces.map(async interface => {
      interfacesAvailable[interface] = await resolver
        .supportsInterface(interface)
        .then(res => res[0]);
    })
  );
  return interfacesAvailable;
}

/**
 * Checks if the provider of the current web3 instance is listening
 *
 * @returns {bool} isListening
 */
function isListening() {
  return eth.net_listening().then(() => true, () => false);
}

module.exports = { getContent };
