pragma solidity ^0.4.4;

import 'zeppelin-solidity/contracts/token/StandardToken.sol';


contract EspeoTokenIco is StandardToken {
    using SafeMath for uint256;

    string public name = "Espeo Token";
    string public symbol = "ESP";
    uint256 public decimals = 18;

    uint256 public totalSupply = 1000000 * (10 ** decimals);
    uint256 public totalRaised; // total ether raised (in wei)

    uint256 public startTimestamp; // timestamp after which ICO will start
    uint256 public durationSeconds = 4 * 7 * 24 * 60 * 60; // 4 weeks

    uint256 public minCap; // the ICO ether goal (in wei)
    uint256 public maxCap; // the ICO ether max cap (in wei)

    /**
     * Address which will receive raised funds 
     * and owns the total supply of tokens
     */
    address public fundsWallet;

    function EspeoTokenIco(
        address _fundsWallet,
        uint256 _startTimestamp,
        uint256 _minCap,
        uint256 _maxCap) {
        fundsWallet = _fundsWallet;
        startTimestamp = _startTimestamp;
        minCap = _minCap;
        maxCap = _maxCap;

        // initially assign all tokens to the fundsWallet
        balances[fundsWallet] = totalSupply;
    }

    function() isIcoOpen payable {
        totalRaised = totalRaised.add(msg.value);

        uint256 tokenAmount = calculateTokenAmount(msg.value);
        balances[fundsWallet] = balances[fundsWallet].sub(tokenAmount);
        balances[msg.sender] = balances[msg.sender].add(tokenAmount);

        // immediately transfer ether to fundsWallet
        fundsWallet.transfer(msg.value);
    }

    function calculateTokenAmount(uint256 weiAmount) constant returns(uint256) {
        // standard rate: 1 ETH : 50 ESP
        uint256 tokenAmount = weiAmount.mul(50);
        if (now <= startTimestamp + 7 days) {
            // +50% bonus during first week
            return tokenAmount.mul(150).div(100);
        } else {
            return tokenAmount;
        }
    }

    function transfer(address _to, uint _value) isIcoFinished returns (bool) {
        return super.transfer(_to, _value);
    }

    function transferFrom(address _from, address _to, uint _value) isIcoFinished returns (bool) {
        return super.transferFrom(_from, _to, _value);
    }

    modifier isIcoOpen() {
        require(now >= startTimestamp);
        require(now <= (startTimestamp + durationSeconds) || totalRaised < minCap);
        require(totalRaised <= maxCap);
        _;
    }

    modifier isIcoFinished() {
        require(now >= startTimestamp);
        require(totalRaised >= maxCap || (now >= (startTimestamp + durationSeconds) && totalRaised >= minCap));
        _;
    }
}