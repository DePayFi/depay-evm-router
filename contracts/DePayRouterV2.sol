// SPDX-License-Identifier: BUSL-1.1

pragma solidity >=0.8.18 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract DePayRouterV2 is Ownable {

  using SafeERC20 for IERC20;

  // Address representing the NATIVE token (e.g. ETH, BNB, MATIC, etc.)
  address public constant NATIVE = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

  // Address of the WRAPPED native token (e.g. WETH, WBNB, etc.)
  address public immutable WRAPPED;

  // Pass the address to the WRAPPED token standard upon initialization
  constructor (address _WRAPPED) {
    WRAPPED = _WRAPPED;
  }

  // Accepts NATIVE payments, which is required in order to swap from and to NATIVE, especially unwrapping as part of conversions
  receive() external payable {}

  // The main pay functionality
  function pay(
    uint amountIn, // amount paid in from sender
    address tokenIn, // address of the token paid in from sender
    address exchangeAddress, // address of the exchange required for conversion
    bytes memory exchangeCall, // calldata required to perform token conversion
    address tokenOut, // address of the token paid out to payment/fee receiver
    uint paymentAmount, // amount paid to payment receiver
    address paymentReceiver, // address of the payment receiver
    uint feeAmount, // amount paid to fee receiver
    address feeReceiver, // address of the fee receiver
    uint deadline // timestamp after which the payment is supposed to fail/revert
  ) external payable returns(bool){

    // Make sure payment deadline has not been passed, yet
    require(deadline > block.timestamp, "DePay: Payment deadline has passed!");

    // Make sure that the sender has paid in the correct token & amount
    if(tokenIn == NATIVE) {
      require(msg.value >= amountIn, 'DePay: Insufficient amount paid in!');
    } else {
      IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
    }

    // Store tokenOut balance prior to conversion & payment
    uint balanceBefore;
    if(tokenOut == NATIVE) {
      balanceBefore = address(this).balance - msg.value;
    } else {
      balanceBefore = IERC20(tokenOut).balanceOf(address(this));
    }

    //(bool success,) = exchange_address.call{value: amount_in}(exchange_call);
    //require(success, "Call failed");

    // Pay paymentReceiver
    if(tokenOut == NATIVE) {
      (bool success,) = paymentReceiver.call{value: paymentAmount}(new bytes(0));
      require(success, 'DePay: NATIVE payment receiver pay out failed!');
    } else {
      IERC20(tokenIn).safeTransferFrom(address(this), paymentReceiver, paymentAmount);
    }

    // Pay feeReceiver
    if(feeReceiver != address(0)) {
      if(tokenOut == NATIVE) {
        (bool success,) = feeReceiver.call{value: feeAmount}(new bytes(0));
        require(success, 'DePay: NATIVE fee receiver pay out failed!');
      } else {
        IERC20(tokenIn).safeTransferFrom(address(this), feeReceiver, feeAmount);
      }
    }

    // Ensure balance remained after conversion & payout
    if(tokenOut == NATIVE) {
      require(address(this).balance >= balanceBefore, 'DePay: Insufficient balance after payment!');
    } else {
      require(IERC20(tokenIn).balanceOf(address(this)) >= balanceBefore, 'DePay: Insufficient balance after payment!');
    }

    return true;
  }

}
