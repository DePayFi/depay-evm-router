// Dependency file: contracts/interfaces/IPermit2.sol

// SPDX-License-Identifier: MIT

// pragma solidity 0.8.18;

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


// Dependency file: contracts/interfaces/IDePayRouterV2.sol


// pragma solidity 0.8.18;

// import 'contracts/interfaces/IPermit2.sol';

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

  struct PermitTransferFromAndSignature {
    IPermit2.PermitTransferFrom permitTransferFrom;
    bytes signature;
  }

  function pay(
    Payment calldata payment
  ) external payable returns(bool);

  function pay(
    IDePayRouterV2.Payment calldata payment,
    PermitTransferFromAndSignature calldata permitTransferFromAndSignature
  ) external payable returns(bool);

  function pay(
    IDePayRouterV2.Payment calldata payment,
    IPermit2.PermitSingle calldata permitSingle,
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


// Root file: contracts/interfaces/IDePayForwarderV2.sol


pragma solidity 0.8.18;

// import 'contracts/interfaces/IDePayRouterV2.sol';

interface IDePayForwarderV2 {

  function forward(
    IDePayRouterV2.Payment calldata payment
  ) external payable returns(bool);

  function toggle(bool stop) external returns(bool);

}
