// SPDX-License-Identifier: MIT

pragma solidity 0.8.26;

interface IWETH {

  function deposit() payable external;
  function transfer(address dst, uint wad) external returns (bool);
  function withdraw(uint wad) external;
}
