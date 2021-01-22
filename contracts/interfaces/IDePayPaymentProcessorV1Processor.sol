// SPDX-License-Identifier: MIT

pragma solidity >=0.7.5 <0.8.0;

interface IDePayPaymentProcessorV1Processor {

  function process(
    address[] calldata path,
    uint[] calldata amounts,
    address[] calldata addresses
  ) external payable returns(bool);
}
