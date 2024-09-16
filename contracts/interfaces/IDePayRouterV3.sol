// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.18;

import './IPermit2.sol';

interface IDePayRouterV3 {

  struct Payment {
    uint256 amountIn;
    uint256 paymentAmount;
    uint256 feeAmount;
    uint256 protocolAmount;
    uint256 deadline;
    address tokenInAddress;
    address exchangeAddress;
    address tokenOutAddress;
    address paymentReceiverAddress;
    address feeReceiverAddress;
    uint8 exchangeType;
    uint8 receiverType;
    bool permit2;
    bytes exchangeCallData;
    bytes receiverCallData;
  }

  struct PermitTransferFromAndSignature {
    IPermit2.PermitTransferFrom permitTransferFrom;
    bytes signature;
  }

  function pay(
    Payment calldata payment
  ) external payable returns(bool);

  function pay(
    IDePayRouterV3.Payment calldata payment,
    PermitTransferFromAndSignature calldata permitTransferFromAndSignature
  ) external payable returns(bool);

  function pay(
    IDePayRouterV3.Payment calldata payment,
    IPermit2.PermitSingle calldata permitSingle,
    bytes calldata signature
  ) external payable returns(bool);

  function enable(address exchange, bool enabled) external returns(bool);

  function withdraw(address token, uint amount) external returns(bool);

}