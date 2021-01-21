// Root file: contracts/interfaces/IDePayPaymentProcessorV1Processor.sol

// SPDX-License-Identifier: MIT

pragma solidity >=0.7.5 <0.8.0;

interface IDePayPaymentProcessorV1Processor {

  function process(
    address[] calldata path,
    uint amountIn,
    uint amountOut,
    uint deadline
  ) external payable returns(bool);
}
