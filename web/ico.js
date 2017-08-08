/// utility methods
const writeValue = (elementId, value) => document.getElementById(elementId).textContent = value;
const toEthString = wei => wei / 10**18 + ' ETH';
const hexSecondsToMillis = hexSeconds => web3.toBigNumber(hexSeconds).toNumber() * 1000;

/// constants
const abi = [{"constant": true,"inputs": [],"name": "name","outputs": [{"name": "","type": "string"}],"payable": false,"type": "function"},{"constant": false,"inputs": [{"name": "_spender","type": "address"},{"name": "_value","type": "uint256"}],"name": "approve","outputs": [{"name": "","type": "bool"}],"payable": false,"type": "function"},{"constant": true,"inputs": [],"name": "totalSupply","outputs": [{"name": "","type": "uint256"}],"payable": false,"type": "function"},{"constant": true,"inputs": [],"name": "fundsWallet","outputs": [{"name": "","type": "address"}],"payable": false,"type": "function"},{"constant": true,"inputs": [],"name": "maxCap","outputs": [{"name": "","type": "uint256"}],"payable": false,"type": "function"},{"constant": false,"inputs": [{"name": "_from","type": "address"},{"name": "_to","type": "address"},{"name": "_value","type": "uint256"}],"name": "transferFrom","outputs": [{"name": "","type": "bool"}],"payable": false,"type": "function"},{"constant": true,"inputs": [],"name": "decimals","outputs": [{"name": "","type": "uint256"}],"payable": false,"type": "function"},{"constant": true,"inputs": [],"name": "minCap","outputs": [{"name": "","type": "uint256"}],"payable": false,"type": "function"},{"constant": true,"inputs": [{"name": "_owner","type": "address"}],"name": "balanceOf","outputs": [{"name": "balance","type": "uint256"}],"payable": false,"type": "function"},{"constant": true,"inputs": [],"name": "symbol","outputs": [{"name": "","type": "string"}],"payable": false,"type": "function"},{"constant": true,"inputs": [],"name": "durationSeconds","outputs": [{"name": "","type": "uint256"}],"payable": false,"type": "function"},{"constant": true,"inputs": [{"name": "weiAmount","type": "uint256"}],"name": "calculateTokenAmount","outputs": [{"name": "","type": "uint256"}],"payable": false,"type": "function"},{"constant": false,"inputs": [{"name": "_to","type": "address"},{"name": "_value","type": "uint256"}],"name": "transfer","outputs": [{"name": "","type": "bool"}],"payable": false,"type": "function"},{"constant": true,"inputs": [],"name": "totalRaised","outputs": [{"name": "","type": "uint256"}],"payable": false,"type": "function"},{"constant": true,"inputs": [{"name": "_owner","type": "address"},{"name": "_spender","type": "address"}],"name": "allowance","outputs": [{"name": "remaining","type": "uint256"}],"payable": false,"type": "function"},{"constant": true,"inputs": [],"name": "startTimestamp","outputs": [{"name": "","type": "uint256"}],"payable": false,"type": "function"},{"inputs": [{"name": "_fundsWallet","type": "address"},{"name": "_startTimestamp","type": "uint256"},{"name": "_minCap","type": "uint256"},{"name": "_maxCap","type": "uint256"}],"payable": false,"type": "constructor"},{"payable": true,"type": "fallback"},{"anonymous": false,"inputs": [{"indexed": true,"name": "owner","type": "address"},{"indexed": true,"name": "spender","type": "address"},{"indexed": false,"name": "value","type": "uint256"}],"name": "Approval","type": "event"},{"anonymous": false,"inputs": [{"indexed": true,"name": "from","type": "address"},{"indexed": true,"name": "to","type": "address"},{"indexed": false,"name": "value","type": "uint256"}],"name": "Transfer","type": "event"}];
const targetApi = 'https://ropsten.infura.io/';
const contractAddress = '0xA292375e9343f1684e36a03b56bCe6E0664aD1f9';

/// getting contract
const web3 = new Web3(new Web3.providers.HttpProvider(targetApi));
const espeoTokenIco = web3.eth.contract(abi).at(contractAddress);

/// read and display values
writeValue('contractAddress', contractAddress);
writeValue('totalRaised', toEthString(espeoTokenIco.totalRaised()));

const startDate = hexSecondsToMillis(espeoTokenIco.startTimestamp());
const endDate = startDate + hexSecondsToMillis(espeoTokenIco.durationSeconds());
writeValue('startDate', new Date(startDate).toLocaleString());
writeValue('endDate', new Date(endDate).toLocaleString());

writeValue('minCap', toEthString(espeoTokenIco.minCap()));
writeValue('maxCap', toEthString(espeoTokenIco.maxCap()));
