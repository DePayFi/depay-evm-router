// Root file: contracts/interfaces/IDePayRouterV1.sol

// SPDX-License-Identifier: MIT

pragma solidity >=0.7.5 <0.8.0;
pragma abicoder v2;

interface IDePayRouterV1 {

  function ETH() external view returns(address);

  function configuration() external view returns(address);

  function route(
    address[] calldata path,
    uint[] calldata amounts,
    address[] calldata addresses,
    address[] calldata plugins,
    string[] calldata data
  ) external payable returns(bool);

  function isApproved(
    address pluginAddress
  ) external view returns(bool);

  function withdraw(
    address token,
    uint amount
  ) external returns(bool);
  
}
