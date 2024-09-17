// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.26;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import './interfaces/IPermit2.sol';
import './interfaces/IDePayRouterV3.sol';
import './interfaces/IDePayForwarderV3.sol';

/// @title DePayRouterV3
/// @notice This contract handles payments and token conversions.
/// @dev Inherit from Ownable2Step for ownership functionalities.
contract DePayRouterV3 is Ownable2Step {

  using SafeERC20 for IERC20;

  // Custom errors
  error PaymentDeadlineReached();
  error WrongAmountPaidIn();
  error ExchangeNotApproved();
  error ExchangeCallMissing();
  error ExchangeCallFailed();
  error ForwardingPaymentFailed();
  error NativePaymentFailed();
  error NativeFeePaymentFailed();
  error PaymentToZeroAddressNotAllowed();
  error InsufficientBalanceInAfterPayment();
  error InsufficientBalanceOutAfterPayment();
  error InsufficientProtocolAmount();

  /// @notice Address representing the NATIVE token (e.g. ETH, BNB, MATIC, etc.)
  address constant NATIVE = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

  /// @notice Address of PERMIT2
  address public immutable PERMIT2;

  /// @notice Address of the payment FORWARDER contract
  address public immutable FORWARDER;

  /// @notice List of approved exchanges for conversion.
  mapping (address => bool) public exchanges;

  /// @dev Initializes the contract with PERMIT2 and FORWARDER addresses.
  /// @param _PERMIT2 The address of the PERMIT2 contract.
  /// @param _FORWARDER The address of the FORWARDER contract.
  constructor (address _PERMIT2, address _FORWARDER) {
    PERMIT2 = _PERMIT2;
    FORWARDER = _FORWARDER;
  }

  /// @notice Accepts NATIVE payments, which is required in order to swap from and to NATIVE, especially unwrapping as part of conversions.
  receive() external payable {}

  /// @dev Payment event.
  event Payment(
    address indexed from,
    address indexed to,
    uint256 indexed deadline, // in milliseconds!
    uint256 amountIn,
    uint256 paymentAmount,
    uint256 feeAmount,
    uint256 protocolAmount,
    address tokenInAddress,
    address tokenOutAddress,
    address feeReceiverAddress
  );

  /// @dev Handles the payment process (tokenIn approval for router has been granted prior).
  /// @param payment The payment data.
  /// @return Returns true if successful.
  function _pay(
    IDePayRouterV3.Payment calldata payment
  ) internal returns(bool){
    uint256 balanceInBefore;
    uint256 balanceOutBefore;

    (balanceInBefore, balanceOutBefore) = _validatePreConditions(payment);
    _payIn(payment);
    _performPayment(payment);
    _validatePostConditions(payment, balanceInBefore, balanceOutBefore);
    _emit(payment);

    return true;
  }

  /// @notice Handles the payment process for external callers.
  /// @param payment The payment data.
  /// @return Returns true if successful.
  function pay(
    IDePayRouterV3.Payment calldata payment
  ) external payable returns(bool){
    return _pay(payment);
  }

  /// @dev Handles the payment process with permit2 SignatureTransfer.
  /// @param payment The payment data.
  /// @param permitTransferFromAndSignature The PermitTransferFrom and signature.
  /// @return Returns true if successful.
  function _pay(
    IDePayRouterV3.Payment calldata payment,
    IDePayRouterV3.PermitTransferFromAndSignature calldata permitTransferFromAndSignature
  ) internal returns(bool){
    uint256 balanceInBefore;
    uint256 balanceOutBefore;

    (balanceInBefore, balanceOutBefore) = _validatePreConditions(payment);
    _payIn(payment, permitTransferFromAndSignature);
    _performPayment(payment);
    _validatePostConditions(payment, balanceInBefore, balanceOutBefore);
    _emit(payment);

    return true;
  }

  /// @notice Handles the payment process with permit2 SignatureTransfer for external callers.
  /// @param payment The payment data.
  /// @param permitTransferFromAndSignature The PermitTransferFrom and signature.
  /// @return Returns true if successful.
  function pay(
    IDePayRouterV3.Payment calldata payment,
    IDePayRouterV3.PermitTransferFromAndSignature calldata permitTransferFromAndSignature
  ) external payable returns(bool){
    return _pay(payment, permitTransferFromAndSignature);
  }

  /// @dev Handles the payment process with permit2 AllowanceTransfer.
  /// @param payment The payment data.
  /// @param permitSingle The permit single data.
  /// @param signature The permit signature.
  /// @return Returns true if successful.
  function _pay(
    IDePayRouterV3.Payment calldata payment,
    IPermit2.PermitSingle calldata permitSingle,
    bytes calldata signature
  ) internal returns(bool){
    uint256 balanceInBefore;
    uint256 balanceOutBefore;

    (balanceInBefore, balanceOutBefore) = _validatePreConditions(payment);
    _permit(permitSingle, signature);
    _payIn(payment);
    _performPayment(payment);
    _validatePostConditions(payment, balanceInBefore, balanceOutBefore);
    _emit(payment);

    return true;
  }

  /// @notice Handles the payment process with permit2 AllowanceTransfer for external callers.
  /// @param payment The payment data.
  /// @param permitSingle The permit single data.
  /// @param signature The permit signature.
  /// @return Returns true if successful.
  function pay(
    IDePayRouterV3.Payment calldata payment,
    IPermit2.PermitSingle calldata permitSingle,
    bytes calldata signature
  ) external payable returns(bool){
    return _pay(payment, permitSingle, signature);
  }

  /// @dev Validates the pre-conditions for a payment.
  /// @param payment The payment data.
  /// @return balanceInBefore The balance in before the payment.
  /// @return balanceOutBefore The balance out before the payment.
  function _validatePreConditions(IDePayRouterV3.Payment calldata payment) internal returns(uint256 balanceInBefore, uint256 balanceOutBefore) {
    // Make sure payment deadline (in milliseconds!) has not been passed, yet
    if(payment.deadline < block.timestamp * 1000) {
      revert PaymentDeadlineReached();
    }

    // Store tokenIn balance prior to payment
    if(payment.tokenInAddress == NATIVE) {
      balanceInBefore = address(this).balance - msg.value;
    } else {
      balanceInBefore = IERC20(payment.tokenInAddress).balanceOf(address(this));
    }

    // Store tokenOut balance prior to payment
    if(payment.tokenOutAddress == NATIVE) {
      balanceOutBefore = address(this).balance - msg.value;
    } else {
      balanceOutBefore = IERC20(payment.tokenOutAddress).balanceOf(address(this));
    }
  }

  /// @dev Handles permit2 operations.
  /// @param permitSingle The permit single data.
  /// @param signature The permit signature.
  function _permit(
    IPermit2.PermitSingle calldata permitSingle,
    bytes calldata signature
  ) internal {

    IPermit2(PERMIT2).permit(
      msg.sender, // owner
      permitSingle,
      signature
    );
  }

  /// @dev Processes the payIn operations.
  /// @param payment The payment data.
  function _payIn(
    IDePayRouterV3.Payment calldata payment
  ) internal {
    if(payment.tokenInAddress == NATIVE) {
      // Make sure that the sender has paid in the correct token & amount
      if(msg.value != payment.amountIn) {
        revert WrongAmountPaidIn();
      }
    } else if(payment.permit2) {
      IPermit2(PERMIT2).transferFrom(msg.sender, address(this), uint160(payment.amountIn), payment.tokenInAddress);
    } else {
      IERC20(payment.tokenInAddress).safeTransferFrom(msg.sender, address(this), payment.amountIn);
    }
  }

  /// @dev Processes the payIn operations (exlusively for permit2 SignatureTransfer).
  /// @param payment The payment data.
  /// @param permitTransferFromAndSignature permitTransferFromAndSignature for permit2 permitTransferFrom.
  function _payIn(
    IDePayRouterV3.Payment calldata payment,
    IDePayRouterV3.PermitTransferFromAndSignature calldata permitTransferFromAndSignature
  ) internal {
      
    IPermit2(PERMIT2).permitTransferFrom(
      permitTransferFromAndSignature.permitTransferFrom,
      IPermit2.SignatureTransferDetails({
        to: address(this),
        requestedAmount: payment.amountIn
      }),
      msg.sender,
      permitTransferFromAndSignature.signature
    );
  }

  /// @dev Processes the payment.
  /// @param payment The payment data.
  function _performPayment(IDePayRouterV3.Payment calldata payment) internal {
    // Perform conversion if required
    if(payment.exchangeAddress != address(0)) {
      _convert(payment);
    }

    // Perform payment to paymentReceiver
    _payReceiver(payment);

    // Perform payment to feeReceiver
    if(payment.feeReceiverAddress != address(0)) {
      _payFee(payment);
    }
  }

  /// @dev Validates the post-conditions for a payment.
  /// @param payment The payment data.
  /// @param balanceInBefore The balance in before the payment.
  /// @param balanceOutBefore The balance out before the payment.
  function _validatePostConditions(IDePayRouterV3.Payment calldata payment, uint256 balanceInBefore, uint256 balanceOutBefore) internal view {
    // Ensure balances of tokenIn remained
    if(payment.tokenInAddress == NATIVE) {
      if(address(this).balance < balanceInBefore) {
        revert InsufficientBalanceInAfterPayment();
      }
    } else {
      if(IERC20(payment.tokenInAddress).balanceOf(address(this)) < balanceInBefore) {
        revert InsufficientBalanceInAfterPayment();
      }
    }

    // Ensure balances of tokenOut remained
    if(payment.tokenOutAddress == NATIVE) {
      if(address(this).balance < balanceOutBefore) {
        revert InsufficientBalanceOutAfterPayment();
      }
    } else {
      if(IERC20(payment.tokenOutAddress).balanceOf(address(this)) < balanceOutBefore) {
        revert InsufficientBalanceOutAfterPayment();
      }
    }

    // Ensure protocolAmount remained within router
    if(payment.protocolAmount > 0) {

      if(payment.tokenOutAddress == NATIVE) {
        if((address(this).balance - payment.protocolAmount) < balanceOutBefore) {
          revert InsufficientProtocolAmount();
        }
      } else {
        if((IERC20(payment.tokenOutAddress).balanceOf(address(this)) - payment.protocolAmount) < balanceOutBefore) {
          revert InsufficientProtocolAmount();
        }
      }
    }
  }

  /// @dev Emits payment event.
  /// @param payment The payment data.
  function _emit(IDePayRouterV3.Payment calldata payment) internal {
    emit Payment(
      msg.sender,
      payment.paymentReceiverAddress,
      payment.deadline, // in milliseconds!
      payment.amountIn,
      payment.paymentAmount,
      payment.feeAmount,
      payment.protocolAmount,
      payment.tokenInAddress,
      payment.tokenOutAddress,
      payment.feeReceiverAddress
    );
  }

  /// @dev Handles token conversions.
  /// @param payment The payment data.
  function _convert(IDePayRouterV3.Payment calldata payment) internal {
    if(!exchanges[payment.exchangeAddress]) {
      revert ExchangeNotApproved();
    }
    bool success;
    if(payment.tokenInAddress == NATIVE) {
      if(payment.exchangeCallData.length == 0) {
        revert ExchangeCallMissing();
      }
      (success,) = payment.exchangeAddress.call{value: msg.value}(payment.exchangeCallData);
    } else {
      if(payment.exchangeType == 1) { // pull
        IERC20(payment.tokenInAddress).safeApprove(payment.exchangeAddress, payment.amountIn);
      } else if(payment.exchangeType == 2) { // push
        IERC20(payment.tokenInAddress).safeTransfer(payment.exchangeAddress, payment.amountIn);
      }
      (success,) = payment.exchangeAddress.call(payment.exchangeCallData);
      if(payment.exchangeType == 1) { // pull
        IERC20(payment.tokenInAddress).safeApprove(payment.exchangeAddress, 0);
      }
    }
    if(!success){
      revert ExchangeCallFailed();
    }
  }

  /// @dev Processes payment to receiver.
  /// @param payment The payment data.
  function _payReceiver(IDePayRouterV3.Payment calldata payment) internal {
    if(payment.receiverType != 0) { // call receiver contract

      {
        bool success;
        if(payment.tokenOutAddress == NATIVE) {
          success = IDePayForwarderV3(FORWARDER).forward{value: payment.paymentAmount}(payment);
        } else {
          IERC20(payment.tokenOutAddress).safeTransfer(FORWARDER, payment.paymentAmount);
          success = IDePayForwarderV3(FORWARDER).forward(payment);
        }
        if(!success) {
          revert ForwardingPaymentFailed();
        }
      }

    } else { // just send payment to address

      if(payment.tokenOutAddress == NATIVE) {
        if(payment.paymentReceiverAddress == address(0)){
          revert PaymentToZeroAddressNotAllowed();
        }
        (bool success,) = payment.paymentReceiverAddress.call{value: payment.paymentAmount}(new bytes(0));
        if(!success) {
          revert NativePaymentFailed();
        }
      } else {
        IERC20(payment.tokenOutAddress).safeTransfer(payment.paymentReceiverAddress, payment.paymentAmount);
      }
    }
  }

  /// @dev Processes fee payments.
  /// @param payment The payment data.
  function _payFee(IDePayRouterV3.Payment calldata payment) internal {
    if(payment.tokenOutAddress == NATIVE) {
      (bool success,) = payment.feeReceiverAddress.call{value: payment.feeAmount}(new bytes(0));
      if(!success) {
        revert NativeFeePaymentFailed();
      }
    } else {
      IERC20(payment.tokenOutAddress).safeTransfer(payment.feeReceiverAddress, payment.feeAmount);
    }
  }

  /// @dev Event emitted if new exchange has been enabled.
  event Enabled(
    address indexed exchange
  );

  /// @dev Event emitted if an exchange has been disabled.
  event Disabled(
    address indexed exchange
  );

  /// @notice Enables or disables an exchange.
  /// @param exchange The address of the exchange.
  /// @param enabled A boolean value to enable or disable the exchange.
  /// @return Returns true if successful.
  function enable(address exchange, bool enabled) external onlyOwner returns(bool) {
    exchanges[exchange] = enabled;
    if(enabled) {
      emit Enabled(exchange);
    } else {
      emit Disabled(exchange);
    }
    return true;
  }

  /// @notice Allows the owner to withdraw accidentally sent tokens.
  /// @param token The token address.
  /// @param amount The amount to withdraw.
  function withdraw(
    address token,
    uint amount
  ) external onlyOwner returns(bool) {
    if(token == NATIVE) {
      (bool success,) = address(msg.sender).call{value: amount}(new bytes(0));
      require(success, 'DePay: withdraw failed!');
    } else {
      IERC20(token).safeTransfer(msg.sender, amount);
    }
    return true;
  }
}
