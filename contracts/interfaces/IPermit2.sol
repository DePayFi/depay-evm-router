// SPDX-License-Identifier: MIT

pragma solidity 0.8.18;

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

  function permit(address owner, PermitSingle memory permitSingle, bytes calldata signature) external;

  function transferFrom(address from, address to, uint160 amount, address token) external;

  function allowance(address user, address token, address spender) external view returns (uint160 amount, uint48 expiration, uint48 nonce);

}
