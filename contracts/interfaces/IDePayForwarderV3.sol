// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.26;

import './IDePayRouterV3.sol';

interface IDePayForwarderV3 {

  function forward(
    IDePayRouterV3.Payment calldata payment
  ) external payable returns(bool);

  function toggle(bool stop) external returns(bool);

}
