// Dependency file: contracts/interfaces/IPermit2.sol

// SPDX-License-Identifier: MIT

// pragma solidity 0.8.26;

interface IPermit2 {

  struct PermitDetails {
    address token;
    uint160 amount;
    uint48 expiration;
    uint48 nonce;
  }

  struct PermitSingle {
    PermitDetails details;
    address spender;
    uint256 sigDeadline;
  }

  struct PermitTransferFrom {
    TokenPermissions permitted;
    uint256 nonce;
    uint256 deadline;
  }

  struct TokenPermissions {
    address token;
    uint256 amount;
  }

  struct SignatureTransferDetails {
    address to;
    uint256 requestedAmount;
  }

  function permit(address owner, PermitSingle memory permitSingle, bytes calldata signature) external;

  function transferFrom(address from, address to, uint160 amount, address token) external;

  function permitTransferFrom(PermitTransferFrom memory permit, SignatureTransferDetails calldata transferDetails, address owner, bytes calldata signature) external;

  function allowance(address user, address token, address spender) external view returns (uint160 amount, uint48 expiration, uint48 nonce);

}


// Root file: contracts/interfaces/IDePayRouterV3.sol


pragma solidity 0.8.26;

// import 'contracts/interfaces/IPermit2.sol';

interface IDePayRouterV3 {

  struct Payment {
    uint256 amountIn;
    uint256 paymentAmount;
    uint256 feeAmount;
    uint256 protocolAmount;
    uint256 deadline; // in milliseconds!
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

  struct Balance {
    uint256 inBefore;
    uint256 inAfter;
    uint256 outBefore;
    uint256 outAfter;
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
