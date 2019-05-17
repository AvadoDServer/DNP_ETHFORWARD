const http = require("http");
const ens = require("./ens");
const httpProxy = require("http-proxy");
const fs = require("fs");
const path = require("path");

// Define params

const responseUnsynced = path.join(__dirname, "unsynced.html");
const response404 = path.join(__dirname, "404.html");
const IPFS_REDIRECT =
  process.env.IPFS_REDIRECT || "http://my.ipfs.dnp.dappnode.eth:8080";
const SWARM_REDIRECT =
  process.env.SWARM_REDIRECT || "http://swarm.dappnode";
const port = process.env.DEV_PORT || 80;

// Start server

console.log(`IPFS redirect set to: ${IPFS_REDIRECT}`);
console.log(`SWARM redirect set to: ${SWARM_REDIRECT}`);
console.log(`Http server listening at port: ${port}`);

const proxy = httpProxy.createProxyServer({});

http
  .createServer(async (req, res) => {
    var domain = req.headers.host;
    const content = await ens.getContent(domain);

    if (content == "0x404") {
      res.writeHead(200, { "Content-Type": "text/html" });
      fs.createReadStream(response404).pipe(res);
    } else if (content == "0x") {
      res.writeHead(200, { "Content-Type": "text/html" });
      fs.createReadStream(responseUnsynced).pipe(res);
    } else {
      if (content.startsWith("/ipfs/")){
        const url = IPFS_REDIRECT + content;
        console.log(`Proxying url: ${url}`);
        proxy.web(req, res, {
          target: url
        });
      } else if(content.startsWith("/bzz:/")){
        const url = SWARM_REDIRECT + content;
        console.log(`Proxying url: ${url}`);
        proxy.web(req, res, {
          target: url
        });
      }
    }
  })
  .listen(port);
