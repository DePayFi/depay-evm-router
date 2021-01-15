// Root file: contracts/interfaces/IDePayPaymentProcessorV1.sol

// SPDX-License-Identifier: MIT

pragma solidity >=0.7.5 <0.8.0;

interface IDePayPaymentProcessorV1 {

  function withdraw(address tokenAddress, uint amount) external returns(bool);
  
}
