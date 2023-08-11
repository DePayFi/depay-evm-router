// SPDX-License-Identifier: BUSL-1.1

pragma solidity >=0.8.18 <0.9.0;

import './IPermit2.sol';

interface IDePayRouterV2 {

  struct Payment {
    uint256 amountIn;
    bool permit2;
    uint256 paymentAmount;
    uint256 feeAmount;
    address tokenInAddress;
    address exchangeAddress;
    address tokenOutAddress;
    address paymentReceiverAddress;
    address feeReceiverAddress;
    uint8 exchangeType;
    uint8 receiverType;
    bytes exchangeCallData;
    bytes receiverCallData;
    uint256 deadline;
  }

  function pay(
    Payment calldata payment
  ) external payable returns(bool);

  function pay(
    IDePayRouterV2.Payment calldata payment,
    IPermit2.PermitSingle memory permitSingle,
    bytes calldata signature
  ) external payable returns(bool);

  event Enabled(
    address indexed exchange
  );

  event Disabled(
    address indexed exchange
  );

  function enable(address exchange, bool enabled) external returns(bool);

  function withdraw(address token, uint amount) external returns(bool);

}
