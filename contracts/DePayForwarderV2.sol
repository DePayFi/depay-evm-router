// SPDX-License-Identifier: BUSL-1.1

pragma solidity >=0.8.18 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract DePayForwarderV2 is Ownable {

  using SafeERC20 for IERC20;

  // Address representing the NATIVE token (e.g. ETH, BNB, MATIC, etc.)
  address public constant NATIVE = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

  constructor () {}

  // Accepts NATIVE payments, which is required in order to forward native payments
  receive() external payable {}

  function forward(
    uint256 amount,
    address token,
    bool push,
    address receiver,
    bytes calldata callData
  ) external payable returns(bool){

    bool success;
    if(push) {
      if(token == NATIVE) {
        (success,) = receiver.call(callData);
      } else {
        IERC20(token).safeTransfer(receiver, amount);
        (success,) = receiver.call(callData);
      }
    } else { // pull
      if(token != NATIVE) {
        IERC20(token).safeApprove(receiver, amount);
      }
      (success,) = receiver.call(callData);
    }

    require(success, "DePay: forwarding payment to receiver failed!");

    return true;
  }
}
