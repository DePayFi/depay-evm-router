// SPDX-License-Identifier: MIT

pragma solidity >=0.8.6 <0.9.0;

interface IMemoworldNFT {
  function mint(
    address account,
    uint256 id,
    uint256 amount,
    bytes memory data
  ) external payable;
}
