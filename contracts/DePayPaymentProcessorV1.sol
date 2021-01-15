// SPDX-License-Identifier: MIT

pragma solidity >=0.7.5 <0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract DePayPaymentProcessorV1 is Ownable {
  
  using SafeMath for uint;

  // Address ZERO indicating ETH transfer, because ETH does not have an address like other tokens
  address private ZERO = 0x0000000000000000000000000000000000000000;

  // The maximum integer used for approvals
  uint private MAXINT = 115792089237316195423570985008687907853269984665640564039457584007913129639935;

  // gas safe transfer of tokens (see: https://github.com/Uniswap/uniswap-v2-core/blob/master/contracts/UniswapV2Pair.sol#L44)
  bytes4 private constant SELECTOR = bytes4(keccak256(bytes('transfer(address,uint256)')));

  event Payment(
    address indexed sender,
    address payable indexed receiver
  );

  receive() external payable {
    // accepts eth payments which are required to
    // swap and pay from ETH to any token
    // especially unwrapping WETH as part of token conversions
  }

  function pay(
    address[] calldata path,
    uint amountIn,
    uint amountOut,
    address payable receiver
  ) external payable returns(bool) {
    if(path[0] == ZERO) { require(msg.value >= amountIn, 'DePay: Insufficient ETH amount payed in.'); }

    _pay(receiver, msg.sender, path[path.length-1], amountOut);

    emit Payment(msg.sender, receiver);

    return true;
  }

  function _pay(address payable receiver, address from, address token, uint amountOut) private {
    if(token == ZERO) {
      receiver.transfer(amountOut);
    } else {
      _transferIn(token, amountOut);
      _safeTransfer(token, receiver, amountOut);
    }
  }

  // makes sure to transfer in the token used as means of payment
  function _transferIn(address token, uint amount) private {
    IERC20(token).transferFrom(msg.sender, address(this), amount);
  }

  // gas safe transfer of tokens (see: https://github.com/Uniswap/uniswap-v2-core/blob/master/contracts/UniswapV2Pair.sol#L44)
  function _safeTransfer(address token, address to, uint value) private {
    (bool success, bytes memory data) = token.call(abi.encodeWithSelector(SELECTOR, to, value));
    require(success && (data.length == 0 || abi.decode(data, (bool))), 'DePay: TRANSFER_FAILED');
  }
  
  function payableOwner() view private returns(address payable) {
    return payable(owner());
  }

  // allows to withdraw accidentally sent ETH or tokens
  function withdraw(
    address tokenAddress,
    uint amount
  ) external onlyOwner returns(bool) {
    if(tokenAddress == ZERO) {
      payableOwner().transfer(amount);
    } else {
      _safeTransfer(tokenAddress, payableOwner(), amount);
    }
    return true;
  }
}
