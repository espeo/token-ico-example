pragma solidity ^0.4.4;

import 'zeppelin-solidity/contracts/token/PausableToken.sol';

contract EspeoTokenIco is PausableToken {
    using SafeMath for uint256;

    string public name = "Espeo Token";
    string public symbol = "ESP";
    uint256 public decimals = 18;

  	uint256 public totalSupply = 1000000 * (10 ** decimals);

    address public fundsWallet;

    function EspeoTokenIco(address _fundsWallet) {
    	fundsWallet = _fundsWallet;

    	// initially assign all tokens to the fundsWallet
    	balances[fundsWallet] = totalSupply;
    }
}