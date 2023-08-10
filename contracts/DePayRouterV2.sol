// SPDX-License-Identifier: BUSL-1.1

pragma solidity >=0.8.18 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import './interfaces/IDePayRouterV2.sol';
import './interfaces/IDePayForwarderV2.sol';

contract DePayRouterV2 is Ownable {

  using SafeERC20 for IERC20;

  // Address representing the NATIVE token (e.g. ETH, BNB, MATIC, etc.)
  address public constant NATIVE = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

  // Address of PERMIT2
  address public immutable PERMIT2;

  // Address of the payment FORWARDER contract
  address public immutable FORWARDER;

  // List of approved exchanges for conversion
  mapping (address => bool) public exchanges;

  constructor (address _PERMIT2, address _FORWARDER) {
    PERMIT2 = _PERMIT2;
    FORWARDER = _FORWARDER;
  }

  // Accepts NATIVE payments, which is required in order to swap from and to NATIVE, especially unwrapping as part of conversions
  receive() external payable {}

  // Transfer polyfil event for internal transfers
  event Transfer(
    address indexed from,
    address indexed to,
    uint256 value
  );


  // Perform a payment (approval granted prior)
  function pay(IDePayRouterV2.Payment memory payment) external payable returns(bool){
    uint256 balanceInBefore;
    uint256 balanceOutBefore;

    (balanceInBefore, balanceOutBefore) = _validatePreConditions(payment);

    _performPayment(payment);

    _validatePostConditions(payment, balanceInBefore, balanceOutBefore);

    return true;
  }

  function _validatePreConditions(IDePayRouterV2.Payment memory payment) internal returns(uint256 balanceInBefore, uint256 balanceOutBefore) {
    // Make sure payment deadline has not been passed, yet
    require(payment.deadline > block.timestamp, "DePay: Payment deadline has passed!");

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

    // Make sure that the sender has paid in the correct token & amount
    if(payment.tokenInAddress == NATIVE) {
      require(msg.value >= payment.amountIn, 'DePay: Insufficient amount paid in!');
    } else {
      IERC20(payment.tokenInAddress).safeTransferFrom(msg.sender, address(this), payment.amountIn);
    }
  }

  function _performPayment(IDePayRouterV2.Payment memory payment) internal {
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

  function _validatePostConditions(IDePayRouterV2.Payment memory payment, uint256 balanceInBefore, uint256 balanceOutBefore) internal view {
    // Ensure balances of tokenIn remained
    if(payment.tokenInAddress == NATIVE) {
      require(address(this).balance >= balanceInBefore, 'DePay: Insufficient balanceIn after payment!');
    } else {
      require(IERC20(payment.tokenInAddress).balanceOf(address(this)) >= balanceInBefore, 'DePay: Insufficient balanceIn after payment!');
    }

    // Ensure balances of tokenOut remained
    if(payment.tokenOutAddress == NATIVE) {
      require(address(this).balance >= balanceOutBefore, 'DePay: Insufficient balanceOut after payment!');
    } else {
      require(IERC20(payment.tokenOutAddress).balanceOf(address(this)) >= balanceOutBefore, 'DePay: Insufficient balanceOut after payment!');
    }
  }

  function _convert(IDePayRouterV2.Payment memory payment) internal {
    require(exchanges[payment.exchangeAddress], 'DePay: Exchange has not been approved!');
    bool success;
    if(payment.tokenInAddress == NATIVE) {
      (success,) = payment.exchangeAddress.call{value: msg.value}(payment.exchangeCallData);
    } else {
      if(payment.exchangeType == 1) { // pull
        IERC20(payment.tokenInAddress).safeApprove(payment.exchangeAddress, payment.amountIn);
      } else if(payment.exchangeType == 2) { // push
        IERC20(payment.tokenInAddress).safeTransfer(payment.exchangeAddress, payment.amountIn);
      }
      (success,) = payment.exchangeAddress.call(payment.exchangeCallData);
    }
    require(success, "DePay: exchange call failed!");
  }

  function _payReceiver(IDePayRouterV2.Payment memory payment) internal {
    if(payment.receiverType != 0) { // call receiver contract

      {
        bool success;
        if(payment.tokenOutAddress == NATIVE) {
          success = IDePayForwarderV2(FORWARDER).forward{value: payment.paymentAmount}(payment);
          emit Transfer(msg.sender, payment.paymentReceiverAddress, payment.paymentAmount);
        } else {
          IERC20(payment.tokenOutAddress).safeTransfer(FORWARDER, payment.paymentAmount);
          success = IDePayForwarderV2(FORWARDER).forward(payment);
        }
        require(success, 'DePay: Forwarding payment to contract failed!');
      }

    } else { // just send payment to address

      if(payment.tokenOutAddress == NATIVE) {
        (bool success,) = payment.paymentReceiverAddress.call{value: payment.paymentAmount}(new bytes(0));
        require(success, 'DePay: NATIVE payment receiver pay out failed!');
        emit Transfer(msg.sender, payment.paymentReceiverAddress, payment.paymentAmount);
      } else {
        IERC20(payment.tokenOutAddress).safeTransfer(payment.paymentReceiverAddress, payment.paymentAmount);
      }
    }
  }

  function _payFee(IDePayRouterV2.Payment memory payment) internal {
    if(payment.tokenOutAddress == NATIVE) {
      (bool success,) = payment.feeReceiverAddress.call{value: payment.feeAmount}(new bytes(0));
      require(success, 'DePay: NATIVE fee receiver pay out failed!');
      emit Transfer(msg.sender, payment.feeReceiverAddress, payment.feeAmount);
    } else {
      IERC20(payment.tokenOutAddress).safeTransfer(payment.feeReceiverAddress, payment.feeAmount);
    }
  }

  // Event emitted if new exchange has been enabled
  event Enabled(
    address indexed exchange
  );

  // Event emitted if an exchange has been disabled
  event Disabled(
    address indexed exchange
  );

  // Enable/Disable an exchange
  function enable(address exchange, bool enabled) external onlyOwner returns(bool) {
    exchanges[exchange] = enabled;
    if(enabled) {
      emit Enabled(exchange);
    } else {
      emit Disabled(exchange);
    }
    return true;
  }

  // Allows to withdraw accidentally sent tokens.
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
