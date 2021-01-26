// SPDX-License-Identifier: MIT

pragma solidity >=0.7.5 <0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import './interfaces/IDePayPaymentProcessorV1Processor.sol';
import './libraries/TransferHelper.sol';

contract DePayPaymentProcessorV1 is Ownable {
  
  using SafeMath for uint;
  using SafeERC20 for IERC20;

  // Address ZERO indicates ETH transfers.
  address public immutable ZERO = address(0);

  // List of approved processors. Use approveProcessor to add new processors.
  mapping (address => address) public approvedProcessors;

  // The payment event.
  event Payment(
    address indexed sender,
    address payable indexed receiver
  );

  // Event to emit newly approved processors.
  event ProcessorApproved(
    address indexed processorAddress
  );

  receive() external payable {
    // Accepts ETH payments which is require in order
    // to swap from and to ETH
    // especially unwrapping WETH as part of token swaps.
  }

  // The main function to process payments.
  function pay(
    // The path of the token conversion.
    address[] calldata path,
    // Amounts passed to proccessors:
    // e.g. [amountIn, amountOut, deadline]
    uint[] calldata amounts,
    // Addresses passed to processors:
    // e.g. [receiver]
    address[] calldata addresses,
    // List and order of processors to be executed for this payment:
    // e.g. [uniswapProcessor,paymentProcessor] to swap and pay
    address[] calldata processors,
    // Data passed to processors:
    // e.g. ["signatureOfSmartContractFunction(address,uint)"] receiving the payment
    string[] calldata data
  ) external payable returns(bool) {
    uint balanceBefore = _balanceBefore(path[path.length-1]);
    _ensureTransferIn(path[0], amounts[0]);
    _process(path, amounts, addresses, processors, data);
    _ensureBalance(path[path.length-1], balanceBefore);
    emit Payment(msg.sender, payable(addresses[addresses.length-1]));
    return true;
  }

  // Returns the balance for a token (or ETH) before the payment is processed.
  // In case of ETH we need to deduct what has been payed in as part of the transaction itself.
  function _balanceBefore(address token) private returns (uint balance) {
    balance = _balance(token);
    if(token == ZERO) { balance -= msg.value; }
  }

  // This makes sure that the sender has payed in the token (or ETH)
  // required to perform the payment.
  function _ensureTransferIn(address tokenIn, uint amountIn) private {
    if(tokenIn == ZERO) { 
      require(msg.value >= amountIn, 'DePay: Insufficient ETH amount payed in!'); 
    } else {
      TransferHelper.safeTransferFrom(tokenIn, msg.sender, address(this), amountIn);
    }
  }

  // Executes processors in the order provided.
  // Calls itself's _pay function if the payment processor contract itself is part of processors.
  function _process(
    address[] calldata path,
    uint[] calldata amounts,
    address[] calldata addresses,
    address[] calldata processors,
    string[] calldata data
  ) internal {
    for (uint i = 0; i < processors.length; i++) {
      if(processors[i] == address(this)) {
        _pay(payable(addresses[addresses.length-1]), path[path.length-1], amounts[1]);
      } else {
        require(_isApproved(processors[i]), 'DePay: Processor not approved!');
        address processor = approvedProcessors[processors[i]];
        (bool success, bytes memory returnData) = processor.delegatecall(abi.encodeWithSelector(
            IDePayPaymentProcessorV1Processor(processor).process.selector, path, amounts, addresses, data
        ));
        require(success, string(returnData));
      }
    }
  }

  // Sends token (or ETH) to receiver.
  function _pay(address payable receiver, address token, uint amountOut) private {
    if(token == ZERO) {
      TransferHelper.safeTransferETH(receiver, amountOut);
    } else {
      TransferHelper.safeTransfer(token, receiver, amountOut);
    }
  }

  // This makes sure that the balance after the payment not less than before.
  // Prevents draining of the contract.
  function _ensureBalance(address tokenOut, uint balanceBefore) private view {
    require(_balance(tokenOut) >= balanceBefore, 'DePay: Insufficient balance after payment!');
  }

  // Returns the balance of the payment processor contract for a token (or ETH).
  function _balance(address token) private view returns(uint) {
    if(token == ZERO) {
        return address(this).balance;
    } else {
        return IERC20(token).balanceOf(address(this));
    }
  }

  // Approves the provided processor.
  function approveProcessor(address processor) external onlyOwner returns(bool) {
    approvedProcessors[processor] = processor;
    emit ProcessorApproved(processor);
    return true;
  }

  // Function to check if a processor address is approved.
  function isApproved(
    address processorAddress
  ) external view returns(bool){
    return _isApproved(processorAddress);
  }

  // Internal function to check if a processor address is approved.
  function _isApproved(
    address processorAddress
  ) internal view returns(bool) {
    return (approvedProcessors[processorAddress] != ZERO);
  }
  
  // Wrapping the contract owner in payable and returns payableOwner.
  function _payableOwner() view private returns(address payable) {
    return payable(owner());
  }

  // Allows to withdraw accidentally sent ETH or tokens.
  function withdraw(
    address token,
    uint amount
  ) external onlyOwner returns(bool) {
    if(token == ZERO) {
      TransferHelper.safeTransferETH(_payableOwner(), amount);
    } else {
      TransferHelper.safeTransfer(token, _payableOwner(), amount);
    }
    return true;
  }
}
