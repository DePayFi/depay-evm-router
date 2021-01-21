// SPDX-License-Identifier: MIT

pragma solidity >=0.7.5 <0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import './interfaces/IDePayPaymentProcessorV1Processor.sol';
import './libraries/TransferHelper.sol';

contract DePayPaymentProcessorV1 is Ownable {
  
  using SafeMath for uint;
  using SafeERC20 for IERC20;

  // Address ZERO indicating ETH transfer, because ETH does not have an address like other tokens
  address private ZERO = 0x0000000000000000000000000000000000000000;

  // List of approved payment processors
  mapping (address => address) private processors;

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
    address payable receiver,
    address[] calldata preProcessors,
    address[] calldata postProcessors
  ) external payable returns(bool) {
    uint balanceBefore = _balance(path[path.length-1]);
    if(path[path.length-1] == ZERO) { balanceBefore -= msg.value; }

    if(path[0] == ZERO) { 
      require(msg.value >= amountIn, 'DePay: Insufficient ETH amount payed in!'); 
    } else {
      TransferHelper.safeTransferFrom(path[0], msg.sender, address(this), amountIn);
    }

    _process(preProcessors, path, amountIn, amountOut);
    _pay(receiver, path[path.length-1], amountOut);
    _process(postProcessors, path, amountIn, amountOut);

    require(_balance(path[path.length-1]) >= balanceBefore, 'DePay: Insufficient balance after payment!');

    emit Payment(msg.sender, receiver);

    return true;
  }

  function _balance(address token) private view returns(uint) {
    if(token == ZERO) {
        return address(this).balance;
    } else {
        return IERC20(token).balanceOf(address(this));
    }
  }

  function _pay(address payable receiver, address token, uint amountOut) private {
    if(token == ZERO) {
      TransferHelper.safeTransferETH(receiver, amountOut);
    } else {
      TransferHelper.safeTransfer(token, receiver, amountOut);
    }
  }

  function approveProcessor(address processor) external onlyOwner returns(bool) {
    processors[processor] = processor;
    return true;
  }

  function _process(
    address[] calldata _processors,
    address[] calldata path,
    uint amountIn,
    uint amountOut
  ) internal {
    for (uint256 i = 0; i < _processors.length; i++) {
      require(_isApproved(_processors[i]), 'DePay: Processor not approved!');
      address processor = processors[_processors[i]];
      (bool success, bytes memory returnData) = processor.delegatecall(abi.encodeWithSelector(
          IDePayPaymentProcessorV1Processor(processor).process.selector, path, amountIn, amountOut
      ));
      require(success, string(returnData));
    }
  }

  function isApproved(
    address processorAddress
  ) external view returns(bool){
    return _isApproved(processorAddress);
  }

  function _isApproved(
    address processorAddress
  ) internal view returns(bool) {
    return (processors[processorAddress] != ZERO);
  }
  
  function _payableOwner() view private returns(address payable) {
    return payable(owner());
  }

  // allows to withdraw accidentally sent ETH or tokens
  function withdraw(
    address tokenAddress,
    uint amount
  ) external onlyOwner returns(bool) {
    if(tokenAddress == ZERO) {
      TransferHelper.safeTransferETH(_payableOwner(), amount);
    } else {
      TransferHelper.safeTransfer(tokenAddress, _payableOwner(), amount);
    }
    return true;
  }
}
