const SHA256 = require('crypto-js/sha256')
const fs = require('fs');
const promisify = require('util').promisify;
const readFile = promisify(fs.readFile);
const JsDiff = require('diff');

class Block {
    constructor(timestamp, data) {
        this.index = 0;
        this.timestamp = timestamp;
        this.data = data;
        this.previousHash = '0';
        this.hash = this.calculateHash();
        this.nonce = 0;
    }

    calculateHash() {
        return SHA256(this.index + this.previousHash + this.timestamp + this.data + this.nonce).toString();
    }

    mineBlock(difficulty) {

    }
}

class Blockchain{
    constructor() {
        this.chain = [this.createGenesis()];
    }

    createGenesis() {
        return new Block('01/01/2017', 'Genesis block', '0')
    }

    latestBlock() {
        return this.chain[this.chain.length - 1]
    }

    async addBlock(newBlock){
        const valid = await this.checkValid(this.chain);
        if (valid) {
          newBlock.previousHash = this.latestBlock().hash;
          newBlock.hash = newBlock.calculateHash();
          this.chain.push(newBlock);
          fs.writeFile('blockchain.txt', JSON.stringify(this.chain), function(err) {
            if(err) {
                return console.log(err);
            }
          }); 
        }
    }

    async checkValid(chain) {
        const tempChain = [];
        chain.forEach((item, index) => {
          if (index === 0) {
            tempChain.push(JSON.parse(JSON.stringify(this.chain[0])));
          } else {
            const newBlock = new Block(item.timestamp, JSON.parse(JSON.stringify(item.data)));
            newBlock.previousHash = tempChain[index - 1].hash;
            newBlock.hash = newBlock.calculateHash();
            tempChain.push(newBlock);
          }
        })

        const originalChain = await readFile('blockchain.txt', 'utf8');
          if (!originalChain) {
            console.log('Initializing blockchain...')
            fs.writeFile('blockchain.txt', JSON.stringify(this.chain), function(err) {
              if(err) {
                  return console.log(err);
              }
            }); 
            return false;
          }
          if (JSON.stringify(tempChain) === JSON.stringify(JSON.parse(originalChain))) {
            console.log('Block is valid...writing to blockchain');
            return true;
          } else {
            console.log('New block invalid...');
            console.log('Old block: ');
            console.log(JSON.parse(JSON.stringify(JSON.parse(originalChain))));
            console.log('New block: ');
            console.log(tempChain);
            console.log('The diff: ');
            const diff = JsDiff.diffChars(JSON.stringify(JSON.parse(originalChain)), JSON.stringify(tempChain));
            console.log(diff);
            return false
          }
    }
}

async function main() {
  const chain = await readFile('blockchain.txt', 'utf8');
  let jsChain;
  if (chain) {
    const tempChain = new Blockchain();
    jsChain = JSON.parse(chain);
    jsChain.addBlock = tempChain.addBlock;
    jsChain.checkValid = tempChain.checkValid;
    jsChain.latestBlock = tempChain.latestBlock;
    jsChain.chain = jsChain;
    jsChain.chain[1].data.currentOwner = 'Bob';
  } else {
    jsChain = new Blockchain();
  }
  jsChain.addBlock(new Block('12/26/2017', {previousOwner: 'Erkan', currentOwner: 'Alex'}));
}

main();
