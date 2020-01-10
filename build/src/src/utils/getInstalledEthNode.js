const autobahn = require('autobahn');
const url = "ws://my.wamp.dnp.dappnode.eth:8080/ws";
const realm = "dappnode_admin";

let endpoint;

const getInstalledEthNode = async () => {

    return new Promise((resolve, reject) => {

        if (endpoint){
            return resolve(endpoint);
        }

        const connection = new autobahn.Connection({
            url,
            realm
        });

        // connection opened
        connection.onopen = async session => {
            console.log("CONNECTED to \nurl: " + url + " \nrealm: " + realm);

            const packages = await session.call("listPackages.dappmanager.dnp.dappnode.eth")
                .then(res => {
                    const packages = JSON.parse(res).result.reduce((accum, curr) => {
                        accum[curr.packageName] = curr;
                        return accum;
                    }, {});
                    return packages;
                });

            const validPackages = process.env.WEB3PROVIDERS.split(",");
            console.log("valid packages=", validPackages);
            endpoint = Object.keys(packages).reduce((accum, packageKey) => {
                const package = packages[packageKey];
                if (validPackages.includes(package.name) && !accum) {
                    console.log("Found valid package", package.name);
                    accum = `http://my.${package.name}:8545`;
                }
                return accum;
            }, null)
            connection.close();
            return resolve(endpoint);
        };
        connection.open();
    });


}


module.exports = getInstalledEthNode;