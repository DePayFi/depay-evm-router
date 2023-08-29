// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import './interfaces/IDePayRouterV2.sol';

contract DePayForwarderV2 is Ownable {

  using SafeERC20 for IERC20;

  error ForwarderHasBeenStopped();
  error NaitvePullNotSupported();
  error ForwardingPaymentFailed();

  // Address representing the NATIVE token (e.g. ETH, BNB, MATIC, etc.)
  address constant NATIVE = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

  // toggle to stop forwarding to other contracts
  bool private stop;
  modifier notStopped() {
    if (stop) {
      revert ForwarderHasBeenStopped();
    }
    _;
  }

  constructor () {}

  // Accepts NATIVE payments, which is required in order to forward native payments
  receive() external payable {}

  function forward(
    IDePayRouterV2.Payment calldata payment
  ) external payable notStopped returns(bool){

    bool success;
    if(payment.receiverType == 2) { // push
      if(payment.tokenOutAddress == NATIVE) {
        (success,) = payment.paymentReceiverAddress.call{value: payment.paymentAmount}(payment.receiverCallData);
      } else {
        IERC20(payment.tokenOutAddress).safeTransfer(payment.paymentReceiverAddress, payment.paymentAmount);
        (success,) = payment.paymentReceiverAddress.call(payment.receiverCallData);
      }
    } else { // pull
      if(payment.tokenOutAddress != NATIVE) {
        IERC20(payment.tokenOutAddress).safeApprove(payment.paymentReceiverAddress, payment.paymentAmount);
      } else {
        revert NaitvePullNotSupported();
      }
      (success,) = payment.paymentReceiverAddress.call(payment.receiverCallData);
    }

    if(!success) {
      revert ForwardingPaymentFailed();
    }

    return true;
  }

  function toggle(bool _stop) external onlyOwner returns(bool){
    stop = _stop;
    return true;
  }
}
