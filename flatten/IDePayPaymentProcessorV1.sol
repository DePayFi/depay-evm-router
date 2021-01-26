// Root file: contracts/interfaces/IDePayPaymentProcessorV1.sol

// SPDX-License-Identifier: MIT

pragma solidity >=0.7.5 <0.8.0;
pragma abicoder v2;

interface IDePayPaymentProcessorV1 {

  event Payment(
    address indexed sender,
    address payable indexed receiver
  );

  event ProcessorApproved(
    address indexed processorAddress
  );

  function ZERO() external view returns(address);

  function approvedProcessors(address) external view returns(address);

  function pay(
    address[] calldata path,
    uint[] calldata amounts,
    address[] calldata addresses,
    address[] calldata processors,
    string[] calldata data
  ) external payable returns(bool);

  function approveProcessor(
    address processor
  ) external returns(bool);

  function isApproved(
    address processorAddress
  ) external view returns(bool);

  function withdraw(
    address token,
    uint amount
  ) external returns(bool);
  
}
