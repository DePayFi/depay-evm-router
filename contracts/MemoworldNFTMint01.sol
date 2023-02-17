// SPDX-License-Identifier: MIT

pragma solidity >=0.8.6 <0.9.0;
pragma abicoder v2;

import {IMemoworldNFT} from './interfaces/IMemoworldNFT.sol';

contract MemoworldNFTMint01 {
  // Address representating NATIVE (e.g. in payment routing paths)
  address public constant NATIVE = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

  // Indicates that this plugin requires delegate call
  bool public immutable delegate = true;
  address public constant MemoworldContract = 0x4908b9381606C34EaF4ea24C01Eb66CBAB2bc749;

  event RouteMint(address indexed sender, uint256 indexed tokenId, uint256 indexed amount);

  constructor() {}

  function execute(
    address[] calldata path,
    uint256[] calldata amounts,
    address[] calldata addresses,
    string[] calldata data
  ) external payable returns (bool) {
    require(path[path.length-1] == NATIVE, 'DePay: Target token needs to be NATIVE!');

    IMemoworldNFT memoContract = IMemoworldNFT(MemoworldContract);
    memoContract.mint{value: amounts[1]}(addresses[0], amounts[5], amounts[6], bytes(''));

    emit RouteMint(addresses[0], amounts[5], amounts[6]);

    return true;
  }
}
