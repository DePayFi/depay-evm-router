// SPDX-License-Identifier: BUSL-1.1

pragma solidity >=0.8.18 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract TestReceiver {

  using SafeERC20 for IERC20;

  receive() external payable {}

  mapping(address => uint256) currentBalance;

  event Received(
    uint256 amountReceived,
    uint256 amountPassed
  );

  function receiveNative(uint256 amount) external payable returns(bool){
    emit Received(msg.value, amount);
    return true;
  }

  function receivePushToken(address token, uint256 amount) external returns(bool){
    uint256 amountPushed = IERC20(token).balanceOf(address(this)) - currentBalance[token];
    emit Received(amountPushed, amount);
    currentBalance[token] = IERC20(token).balanceOf(address(this));
    return true;
  }

  function receivePullToken(address token, uint256 amount) external returns(bool){
    IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
    uint256 amountPulled = IERC20(token).balanceOf(address(this)) - currentBalance[token];
    emit Received(amountPulled, amount);
    currentBalance[token] = IERC20(token).balanceOf(address(this));
    return true;
  }
}
