const EspeoTokenIco = artifacts.require('./EspeoTokenIco.sol');

contract('EspeoTokenIco', accounts => {

  it('should have initial supply of 1,000,000 units assigned to funds wallet', () => {
    var espeoToken;

    const fundsWallet = accounts[1];
    const expectedSupply = 1000000 * Math.pow(10, 18);

    return EspeoTokenIco.new(fundsWallet).then(instance => {
      espeoToken = instance;
      return espeoToken.totalSupply().then(totalSupply => {
        assert.equal(totalSupply, expectedSupply, 'Total supply mismatch');
        return espeoToken.balanceOf(fundsWallet);
      }).then(fundsWalletBalance => {
        assert.equal(fundsWalletBalance.toNumber(), expectedSupply, 'Initial funds wallet balance mismatch');
      });
    });
  });
});
    // it('should put 10000 EspeoTokenIco in the first account', function() {
    //   return EspeoTokenIco.deployed().then(function(instance) {
    //     return instance.getBalance.call(accounts[0]);
    //   }).then(function(balance) {
    //     assert.equal(balance.valueOf(), 10000, '10000 wasn't in the first account');
    //   });
    // });
    // it('should call a function that depends on a linked library', function() {
    //   var meta;
    //   var metaCoinBalance;
    //   var metaCoinEthBalance;
    //   return EspeoTokenIco.deployed().then(function(instance) {
    //     meta = instance;
    //     return meta.getBalance.call(accounts[0]);
    //   }).then(function(outCoinBalance) {
    //     metaCoinBalance = outCoinBalance.toNumber();
    //     return meta.getBalanceInEth.call(accounts[0]);
    //   }).then(function(outCoinBalanceEth) {
    //     metaCoinEthBalance = outCoinBalanceEth.toNumber();
    //   }).then(function() {
    //     assert.equal(metaCoinEthBalance, 2 * metaCoinBalance, 'Library function returned unexpected function, linkage may be broken');
    //   });
    // });
    // it('should send coin correctly', function() {
    //   var meta;
    //   // Get initial balances of first and second account.
    //   var account_one = accounts[0];
    //   var account_two = accounts[1];
    //   var account_one_starting_balance;
    //   var account_two_starting_balance;
    //   var account_one_ending_balance;
    //   var account_two_ending_balance;
    //   var amount = 10;
    //   return EspeoTokenIco.deployed().then(function(instance) {
    //     meta = instance;
    //     return meta.getBalance.call(account_one);
    //   }).then(function(balance) {
    //     account_one_starting_balance = balance.toNumber();
    //     return meta.getBalance.call(account_two);
    //   }).then(function(balance) {
    //     account_two_starting_balance = balance.toNumber();
    //     return meta.sendCoin(account_two, amount, {from: account_one});
    //   }).then(function() {
    //     return meta.getBalance.call(account_one);
    //   }).then(function(balance) {
    //     account_one_ending_balance = balance.toNumber();
    //     return meta.getBalance.call(account_two);
    //   }).then(function(balance) {
    //     account_two_ending_balance = balance.toNumber();
    //     assert.equal(account_one_ending_balance, account_one_starting_balance - amount, 'Amount wasn't correctly taken from the sender');
    //     assert.equal(account_two_ending_balance, account_two_starting_balance + amount, 'Amount wasn't correctly sent to the receiver');
    //   });
    // });