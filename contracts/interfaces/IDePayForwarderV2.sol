// SPDX-License-Identifier: BUSL-1.1

pragma solidity >=0.8.18 <0.9.0;

import './IDePayRouterV2.sol';

interface IDePayForwarderV2 {

  function ETH() external view returns(address);

  function forward(
    IDePayRouterV2.Payment calldata payment
  ) external payable returns(bool);

  function toggle(bool stop) external returns(bool);

}
