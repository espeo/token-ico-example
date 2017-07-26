const EspeoTokenIco = artifacts.require('./EspeoTokenIco.sol');

// various test utility functions
const transaction = (address, wei) => ({
  from: address,
  value: wei
});
const ethBalance = (address) => web3.eth.getBalance(address).toNumber();
const toWei = (number) => number * Math.pow(10, 18);
const fail = (msg) => (error) => assert(false, error ? `${msg}, but got error: ${error.message}` : msg);
const assertExpectedError = (error) => assert(error.message.indexOf('invalid opcode') >= 0, `Expected throw, but got: ${error.message}`);
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
  it('should have initial supply of 1,000,000 units assigned to funds wallet', () => {
    var espeoToken;

    const expectedSupply = toWei(1000000); // wei have same decimal precision

    return createToken().then(instance => {
      espeoToken = instance;
      return espeoToken.totalSupply().then(totalSupply => {
        assert.equal(totalSupply, expectedSupply, 'Total supply mismatch');
        return espeoToken.balanceOf(fundsWallet);
      }).then(fundsWalletBalance => {
        assert.equal(fundsWalletBalance.toNumber(), expectedSupply, 'Initial funds wallet balance mismatch');
      });
    });
  });

  // REQ002: The ICO is going to last 4 weeks, 
  // trying to raise a minimum of 1,000 ETH and maximum of 20,000 ETH;
  // if the goal is not met the ICO continues until the payments reach the min cap
  it('should open at startTimestamp', () => {
    var espeoToken;

    const startTimestamp = timeController.currentTimestamp() + 3600;
    return EspeoTokenIco.new(fundsWallet, startTimestamp, minCap, maxCap).then(instance => {
        espeoToken = instance;

        return espeoToken.sendTransaction(transaction(buyerOneWallet, oneEth));
      })
      .then(fail('should be closed')).catch(assertExpectedError)
      .then(() => timeController.addSeconds(3600))
      .then(() => espeoToken.sendTransaction(transaction(buyerOneWallet, oneEth)))
      .catch(fail('should be open'));
  });

  it('should last 4 weeks if the goal is reached and allow token transfers afterwards', () => {
    var espeoToken;

    return createToken().then(instance => {
        espeoToken = instance;

        return espeoToken.sendTransaction(transaction(buyerOneWallet, minCap));
      })
      .then(() => timeController.addDays(4 * 7))
      .then(() => espeoToken.sendTransaction(transaction(buyerTwoWallet, oneEth)))
      .then(fail('should be closed')).catch(assertExpectedError)
      .then(() => espeoToken.totalRaised())
      .then(totalRaised => assert.equal(totalRaised.toNumber(), minCap, 'Total raised amount mismatch'))
      // REQ004
      .then(() => espeoToken.transfer(buyerTwoWallet, 1, {
        from: buyerOneWallet
      }))
      .catch(fail('should allow token transfer after ICO'));
  });

  it('should last more then 4 weeks if the goal is not reached and allow token transfers after closing', () => {
    var espeoToken;

    return createToken().then(instance => {
        espeoToken = instance;

        return espeoToken.sendTransaction(transaction(buyerOneWallet, oneEth));
      })
      .then(() => timeController.addDays(4 * 7 + 1))
      .then(() => espeoToken.sendTransaction(transaction(buyerTwoWallet, minCap - oneEth)))
      .catch(fail('should be still open'))
      .then(() => espeoToken.sendTransaction(transaction(buyerThreeWallet, oneEth)))
      .then(fail('should close after reaching goal')).catch(assertExpectedError)
      .then(() => espeoToken.totalRaised())
      .then(totalRaised => assert.equal(totalRaised.toNumber(), minCap, 'Total raised amount mismatch'))
      // REQ004
      .then(() => espeoToken.transfer(buyerTwoWallet, 1, {
        from: buyerOneWallet
      }))
      .catch(fail('should allow token transfer after ICO'));
  });

  it('should close after the max cap is reached and allow token transfers afterwards', () => {
    var espeoToken;

    return createToken().then(instance => {
        espeoToken = instance;

        return espeoToken.sendTransaction(transaction(buyerOneWallet, oneEth));
      })
      .then(() => espeoToken.sendTransaction(transaction(buyerTwoWallet, maxCap)))
      .catch(fail('should allow previous transactions'))
      .then(() => espeoToken.sendTransaction(transaction(buyerThreeWallet, oneEth)))
      .then(fail('should close after reaching max cap')).catch(assertExpectedError)
      .then(() => espeoToken.totalRaised())
      .then(totalRaised => assert.equal(totalRaised.toNumber(), maxCap + oneEth, 'Total raised amount mismatch'))
      // REQ004
      .then(() => espeoToken.transfer(buyerTwoWallet, 1, {
        from: buyerOneWallet
      }))
      .catch(fail('should allow token transfer after ICO'));
  });

  // REQ003: Raised ether is going to be transferred to a specific wallet after each payment,
  it('should transfer raised funds to fundsWallet after each payment', () => {
    const initialFundsWalletBalance = ethBalance(fundsWallet);
    const expectedBalanceGrowth = (wei) => initialFundsWalletBalance + wei;

    var espeoToken;

    return createToken().then(instance => {
        espeoToken = instance;

        return espeoToken.sendTransaction(transaction(buyerOneWallet, oneEth));
      })
      .then(() => {
        assert.equal(ethBalance(espeoToken.address), 0, 'Contract balance mismatch');
        assert.equal(ethBalance(fundsWallet), expectedBalanceGrowth(oneEth), 'Funds wallet balance mismatch');
      })
      .then(() => espeoToken.sendTransaction(transaction(buyerTwoWallet, oneEth)))
      .then(() => {
        assert.equal(ethBalance(espeoToken.address), 0, 'Contract balance mismatch');
        assert.equal(ethBalance(fundsWallet), expectedBalanceGrowth(oneEth * 2), 'Funds wallet balance mismatch');
      });
  });

  // REQ004: Tokens are going to be available for transfers only after the ICO ends,
  it('should not allow token transfers before ICO', () => {
    var espeoToken;

    const startTimestamp = timeController.currentTimestamp() + 3600;
    return EspeoTokenIco.new(fundsWallet, startTimestamp, minCap, maxCap).then(instance => {
        espeoToken = instance;

        return espeoToken.sendTransaction(transaction(buyerOneWallet, oneEth));
      })
      .then(() => espeoToken.transfer(buyerTwoWallet, 1, {
        from: buyerOneWallet
      }))
      .then(fail('should not allow token transfer before ICO')).catch(assertExpectedError);
  });

  it('should not allow token transfers during ICO', () => {
    var espeoToken;

    return createToken().then(instance => {
        espeoToken = instance;

        return espeoToken.sendTransaction(transaction(buyerOneWallet, oneEth));
      })
      .then(() => espeoToken.transfer(buyerTwoWallet, 1, {
        from: buyerOneWallet
      }))
      .then(fail('should not allow token transfer during ICO')).catch(assertExpectedError);
  });

  // REQ005: The tokens are going to be sold at a flat rate of 1 ETH : 50 ESP, 
  // with added +50% bonus during the first week.
  it('should be sold with +50% bonus during the first week', () => {
    var espeoToken;

    return createToken().then(instance => {
        espeoToken = instance;

        return espeoToken.sendTransaction(transaction(buyerOneWallet, oneEth));
      })
      .then(() => espeoToken.balanceOf(buyerOneWallet))
      .then(buyerOneBalance => assert.equal(buyerOneBalance.toNumber(), 50 * oneEth * 1.5, 'Buyer one token balance mismatch'));
  });

  it('should be sold with no bonus after the first week', () => {
    var espeoToken;

    return createToken().then(instance => {
        espeoToken = instance;

        return timeController.addDays(7);
      })
      .then(() => espeoToken.sendTransaction(transaction(buyerOneWallet, oneEth)))
      .then(() => espeoToken.balanceOf(buyerOneWallet))
      .then(buyerOneBalance => assert.equal(buyerOneBalance.toNumber(), 50 * oneEth, 'Buyer one token balance mismatch'));
  });

});