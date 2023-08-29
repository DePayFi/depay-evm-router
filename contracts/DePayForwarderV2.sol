// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.18;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import './interfaces/IDePayRouterV2.sol';

/// @title DePayForwarderV2
/// @notice This contract forwards payments based on given instructions.
/// @dev Inherit from Ownable2Step for ownership functionalities.
contract DePayForwarderV2 is Ownable2Step {

  using SafeERC20 for IERC20;

  // Custom errors
  error ForwarderHasBeenStopped();
  error NaitvePullNotSupported();
  error ForwardingPaymentFailed();

  /// @notice Address representing the NATIVE token (e.g. ETH, BNB, MATIC, etc.)
  address constant NATIVE = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

  /// @dev Toggle to stop forwarding to other contracts
  uint256 private stop = 2;

  /// @dev Ensures the forwarder is not stopped.
  modifier notStopped() {
    if (stop == 1) {
      revert ForwarderHasBeenStopped();
    }
    _;
  }

  /// @notice Constructor initializes the forwarder contract.
  constructor () {}

  /// @notice Accepts NATIVE payments, which is required in order to swap from and to NATIVE, especially unwrapping as part of conversions.
  receive() external payable {}

  /// @notice Forwards payments based on provided payment instructions.
  /// @param payment The payment instruction data.
  /// @return Returns true if payment forwarding was successful.
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

  /// @notice Allows the owner to toggle the forwarder stop status.
  /// @param _stop Status to set for the forwarder: 1 to stop, 0 to resume.
  /// @return Returns true if operation was successful.
  function toggle(uint256 _stop) external onlyOwner returns(bool){
    stop = _stop;
    return true;
  }
}
