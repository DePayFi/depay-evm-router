// Root file: contracts/interfaces/IDePayPaymentProcessorV1Processor.sol

// SPDX-License-Identifier: MIT

pragma solidity >=0.7.5 <0.8.0;
pragma abicoder v2;

interface IDePayPaymentProcessorV1Processor {

  function process(
    address[] calldata path,
    uint[] calldata amounts,
    address[] calldata addresses,
    string[] calldata data
  ) external payable returns(bool);
}
