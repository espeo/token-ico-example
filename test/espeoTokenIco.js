const EspeoTokenIco = artifacts.require('./EspeoTokenIco.sol');

// various test utility functions
const transaction = (address, wei) => ({
  from: address,
  value: wei
});
const ethBalance = (address) => web3.eth.getBalance(address).toNumber();
const toWei = (number) => number * Math.pow(10, 18);
const fail = (msg) => (error) => assert(false, error ? `${msg}, but got error: ${error.message}` : msg);
const assertExpectedError = async (promise) => {
  try {
    await promise;
    fail('expected to fail');
  } catch (error) {
    assert(error.message.indexOf('invalid opcode') >= 0, `Expected throw, but got: ${error.message}`);
  }
}
const timeController = (() => {

  const addSeconds = (seconds) => new Promise((resolve, reject) =>
    web3.currentProvider.sendAsync({
      jsonrpc: "2.0",
      method: "evm_increaseTime",
      params: [seconds],
      id: new Date().getTime()
    }, (error, result) => error ? reject(error) : resolve(result.result)));

  const addDays = (days) => addSeconds(days * 24 * 60 * 60);

  const currentTimestamp = () => web3.eth.getBlock(web3.eth.blockNumber).timestamp;

  return {
    addSeconds,
    addDays,
    currentTimestamp
  };
})();

contract('EspeoTokenIco', accounts => {

  const fundsWallet = accounts[1];
  const buyerOneWallet = accounts[2];
  const buyerTwoWallet = accounts[3];
  const buyerThreeWallet = accounts[4];

  const oneEth = toWei(1);
  const minCap = toWei(2);
  const maxCap = toWei(5);

  const createToken = () => EspeoTokenIco.new(fundsWallet, timeController.currentTimestamp(), minCap, maxCap);

  // REQ001: Basic ERC20 “Espeo Token” with symbol of “ESP”, 
  // 18 decimals (reflecting ether’s smallest unit - wei) 
  // and total supply of 1,000,000 units created at contract deployment 
  // and assigned to a specific wallet,
  it('should have initial supply of 1,000,000 units assigned to funds wallet', async () => {
    const espeoToken = await createToken();
    const expectedSupply = toWei(1000000);

    const totalSupply = await espeoToken.totalSupply();
    assert.equal(totalSupply, expectedSupply, 'Total supply mismatch');

    const fundsWalletBalance = await espeoToken.balanceOf(fundsWallet);
    assert.equal(fundsWalletBalance.toNumber(), expectedSupply, 'Initial funds wallet balance mismatch');
  });

  // REQ002: The ICO is going to last 4 weeks, 
  // trying to raise a minimum of 1,000 ETH and maximum of 20,000 ETH;
  // if the goal is not met the ICO continues until the payments reach the min cap
  it('should open at startTimestamp', async () => {
    const startTimestamp = timeController.currentTimestamp() + 3600;
    const espeoToken = await EspeoTokenIco.new(fundsWallet, startTimestamp, minCap, maxCap);

    // should be closed
    assertExpectedError(espeoToken.sendTransaction(transaction(buyerOneWallet, oneEth)));

    await timeController.addSeconds(3600);

    // should be open
    await espeoToken.sendTransaction(transaction(buyerOneWallet, oneEth));
  });

  it('should last 4 weeks if the goal is reached and allow token transfers afterwards', async () => {
    const espeoToken = await createToken();

    await espeoToken.sendTransaction(transaction(buyerOneWallet, minCap));
    await timeController.addDays(4 * 7);

    // should be closed
    assertExpectedError(espeoToken.sendTransaction(transaction(buyerTwoWallet, oneEth)));

    const totalRaised = await espeoToken.totalRaised();
    assert.equal(totalRaised.toNumber(), minCap, 'Total raised amount mismatch')

    // REQ004 should allow token transfer
    await espeoToken.transfer(buyerTwoWallet, 1, { from: buyerOneWallet });
  });

  it('should last more then 4 weeks if the goal is not reached and allow token transfers after closing', async () => {
    const espeoToken = await createToken();

    await espeoToken.sendTransaction(transaction(buyerOneWallet, oneEth));
    await timeController.addDays(4 * 7 + 1);

    // should still be open
    await espeoToken.sendTransaction(transaction(buyerTwoWallet, minCap - oneEth));

    // should be closed
    assertExpectedError(espeoToken.sendTransaction(transaction(buyerThreeWallet, oneEth)));

    const totalRaised = await espeoToken.totalRaised();
    assert.equal(totalRaised.toNumber(), minCap, 'Total raised amount mismatch');

    // REQ004 should allow token transfer
    await espeoToken.transfer(buyerTwoWallet, 1, { from: buyerOneWallet });
  });

  it('should close after the max cap is reached and allow token transfers afterwards', async () => {
    const espeoToken = await createToken();

    await espeoToken.sendTransaction(transaction(buyerOneWallet, oneEth));
    // should allow going over max cap
    await espeoToken.sendTransaction(transaction(buyerTwoWallet, maxCap));

    // should close after reaching max cap
    assertExpectedError(espeoToken.sendTransaction(transaction(buyerThreeWallet, oneEth)));

    const totalRaised = await espeoToken.totalRaised();
    assert.equal(totalRaised.toNumber(), maxCap + oneEth, 'Total raised amount mismatch');
  });

  // REQ003: Raised ether is going to be transferred to a specific wallet after each payment,
  it('should transfer raised funds to fundsWallet after each payment', async () => {
    const initialFundsWalletBalance = ethBalance(fundsWallet);
    const expectedBalanceGrowth = (wei) => initialFundsWalletBalance + wei;

    const espeoToken = await createToken();

    await espeoToken.sendTransaction(transaction(buyerOneWallet, oneEth));

    assert.equal(ethBalance(espeoToken.address), 0, 'Contract balance mismatch');
    assert.equal(ethBalance(fundsWallet), expectedBalanceGrowth(oneEth), 'Funds wallet balance mismatch');

    await espeoToken.sendTransaction(transaction(buyerTwoWallet, oneEth));

    assert.equal(ethBalance(espeoToken.address), 0, 'Contract balance mismatch');
    assert.equal(ethBalance(fundsWallet), expectedBalanceGrowth(oneEth * 2), 'Funds wallet balance mismatch');
  });

  // REQ004: Tokens are going to be available for transfers only after the ICO ends,
  it('should not allow token transfers before ICO', async () => {
    const startTimestamp = timeController.currentTimestamp() + 3600;
    const espeoToken = await EspeoTokenIco.new(fundsWallet, startTimestamp, minCap, maxCap);

    // should not allow token transfer before ICO
    assertExpectedError(espeoToken.transfer(buyerTwoWallet, 1, { from: buyerOneWallet }));
  });

  it('should not allow token transfers during ICO', async () => {
    const espeoToken = await createToken();

    await espeoToken.sendTransaction(transaction(buyerOneWallet, oneEth));

    // should not allow token transfer during ICO
    assertExpectedError(espeoToken.transfer(buyerTwoWallet, 1, { from: buyerOneWallet }));
  });

  // REQ005: The tokens are going to be sold at a flat rate of 1 ETH : 50 ESP, 
  // with added +50% bonus during the first week.
  it('should be sold with +50% bonus during the first week', async () => {
    const espeoToken = await createToken();

    await espeoToken.sendTransaction(transaction(buyerOneWallet, oneEth));

    const buyerOneBalance = await espeoToken.balanceOf(buyerOneWallet);
    assert.equal(buyerOneBalance.toNumber(), 50 * oneEth * 1.5, 'Buyer one token balance mismatch');
  });

  it('should be sold with no bonus after the first week', async () => {
    const espeoToken = await createToken();

    await timeController.addDays(7);
    await espeoToken.sendTransaction(transaction(buyerOneWallet, oneEth));

    const buyerOneBalance = await espeoToken.balanceOf(buyerOneWallet);
    assert.equal(buyerOneBalance.toNumber(), 50 * oneEth, 'Buyer one token balance mismatch');
  });

});