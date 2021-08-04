// SPDX-License-Identifier: MIT

pragma solidity >=0.8.6 <0.9.0;

interface IDePayRouterV1Plugin {

  function delegate() external returns(bool);

  function execute(
    address[] calldata path,
    uint[] calldata amounts,
    address[] calldata addresses,
    string[] calldata data
  ) external payable returns(bool);
  
}
