// Root file: contracts/interfaces/IWETH.sol

// SPDX-License-Identifier: GPL-3.0-only

pragma solidity >=0.8.6 <0.9.0;

interface IWETH {
  function deposit() external payable;

  function withdraw(uint256 wad) external;

  function totalSupply() external view returns (uint256);

  function approve(address guy, uint256 wad) external returns (bool);

  function transfer(address dst, uint256 wad) external returns (bool);

  function transferFrom(
    address src,
    address dst,
    uint256 wad
  ) external returns (bool);
}
