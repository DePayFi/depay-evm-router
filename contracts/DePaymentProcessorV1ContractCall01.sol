// SPDX-License-Identifier: MIT

pragma solidity >=0.7.5 <0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import './libraries/TransferHelper.sol';

contract DePayPaymentProcessorV1Uniswap01 {
  
  using SafeMath for uint;

  function process(
    address[] calldata path,
    uint[] calldata amounts,
    address[] calldata addresses
  ) external payable returns(bool success) {
    // (success, bytes memory returnData) = processor.delegatecall(abi.encodeWithSelector(
    //   address(addresses[0]).call{value: 1 ether}(abi.encodeWithSignature("someOtherFunction(uint256)", 123));
    // ));
    // require(success, string(returnData));

    return true;
  }
}
