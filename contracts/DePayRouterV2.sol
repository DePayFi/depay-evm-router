// SPDX-License-Identifier: BUSL-1.1

pragma solidity >=0.8.18 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
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

  // Payment structure
  struct Payment {
    uint256 amountIn;
    uint256 paymentAmount;
    uint256 feeAmount;
    address tokenInAddress;
    address exchangeAddress;
    address tokenOutAddress;
    address paymentReceiverAddress;
    address feeReceiverAddress;
    uint8 exchangeType;
      // 0: do nothing e.g. WETH
      // 1: pull e.g. Uniswap v2
      // 2: push e.g. Uniswap v3
    uint8 receiverType;
      // 0: do not call receiver
      // 1: pull payment from receiver
      // 2: push payment to receiver
    bytes exchangeCallData;
    bytes receiverCallData;
    uint256 deadline;
  }

  // Perform a payment
  function pay(Payment memory payment) external payable returns(bool){

    // Make sure payment deadline has not been passed, yet
    require(payment.deadline > block.timestamp, "DePay: Payment deadline has passed!");

    // Store tokenIn balance prior to payment
    uint256 balanceInBefore;
    if(payment.tokenInAddress == NATIVE) {
      balanceInBefore = address(this).balance - msg.value;
    } else {
      balanceInBefore = IERC20(payment.tokenInAddress).balanceOf(address(this));
    }

    // Store tokenOut balance prior to payment
    uint256 balanceOutBefore;
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

    // Perform conversion if required
    if(payment.exchangeAddress != address(0)) { _convert(payment); }

    // Perform payment to paymentReceiver and feereceiver
    _payReceiver(payment);
    _payFees(payment);

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

    return true;
  }

  function _convert(Payment memory payment) internal {
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

  function _payReceiver(Payment memory payment) internal {
    if(payment.receiverType != 0) { // call receiver contract

      // if(addresses[2] == NATIVE) {
      //   bool success = IDePayForwarderV2(FORWARDER).forward{value: amounts[1]}(
      //     amounts[1], // amount
      //     addresses[2], // token
      //     types[1] == 2, // push
      //     addresses[3], // receiver
      //     callData[1] // callData
      //   );
      //   require(success, 'DePay: NATIVE payment receiver pay out to contract failed!');
      //   emit Transfer(msg.sender, addresses[3], amounts[1]);
      // } else {

      // }

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

  function _payFees(Payment memory payment) internal {
    if(payment.feeReceiverAddress != address(0)) {
      if(payment.tokenOutAddress == NATIVE) {
        (bool success,) = payment.feeReceiverAddress.call{value: payment.feeAmount}(new bytes(0));
        require(success, 'DePay: NATIVE fee receiver pay out failed!');
        emit Transfer(msg.sender, payment.feeReceiverAddress, payment.feeAmount);
      } else {
        IERC20(payment.tokenOutAddress).safeTransfer(payment.feeReceiverAddress, payment.feeAmount);
      }
    }
  }

  // Event emitted if new exchange has been approved
  event Approved(
    address indexed exchange
  );

  // Approves exchange
  function approve(address exchange) external onlyOwner returns(bool) {
    exchanges[exchange] = true;
    emit Approved(exchange);
    return true;
  }
}
