// SPDX-License-Identifier: BUSL-1.1

pragma solidity >=0.8.18 <0.9.0;

interface IDePayForwarderV2 {

  function ETH() external view returns(address);

  function forward(
    uint256 amount,
    address token,
    bool push,
    address receiver,
    bytes calldata callData
  ) external payable returns(bool);

}
