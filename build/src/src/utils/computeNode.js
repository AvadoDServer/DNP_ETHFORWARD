const web3Utils = require("web3-utils");

const sha3 = web3Utils.sha3;

function computeNode(name) {
  var node =
    "0x0000000000000000000000000000000000000000000000000000000000000000";
  if (name != "") {
    var labels = name.split(".");
    for (var i = labels.length - 1; i >= 0; i--) {
      node = sha3(node + sha3(labels[i]).slice(2), {
        encoding: "hex"
      });
    }
  }
  return node.toString();
}

module.exports = computeNode;
