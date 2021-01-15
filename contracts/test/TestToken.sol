// SPDX-License-Identifier: MIT

// used for running automated hardhat tests

pragma solidity >=0.7.5 <0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {

  constructor() public ERC20("TestToken", "TT") {
      _mint(msg.sender, 1000000000000000000000000);
  }
}
