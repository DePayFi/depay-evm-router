// SPDX-License-Identifier: BUSL-1.1

pragma solidity >=0.8.18 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "hardhat/console.sol";

contract DePayRouterV2 is Ownable {

  using SafeERC20 for IERC20;

  // Address representing the NATIVE token (e.g. ETH, BNB, MATIC, etc.)
  address public constant NATIVE = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

  // Address of the WRAPPED native token (e.g. WETH, WBNB, etc.)
  address public immutable WRAPPED;

  // List of approved exchanges for conversion
  mapping (address => bool) public exchanges;

  // Pass the address to the WRAPPED token standard upon initialization
  constructor (address _WRAPPED) {
    WRAPPED = _WRAPPED;
  }

  // Accepts NATIVE payments, which is required in order to swap from and to NATIVE, especially unwrapping as part of conversions
  receive() external payable {}

  // Transfer polyfil event for internal transfers
  event Transfer(
    address indexed from,
    address indexed to,
    uint256 value
  );

  // perform a payment
  function pay(

    // [
    //    0: amountIn,
    //    1: paymentAmount,
    //    2: feeAmount
    // ]
    uint256[] calldata amounts, 
    
    // [
    //    0: tokenInAddress,
    //    1: exchangeAddress,
    //    2: tokenOutAddress,
    //    3: paymentReceiverAddress,
    //    4: feeAddress
    // ]
    address[] calldata addresses,
    
    // pull requires approve, push is pushing the token prior calling
    // [
    //    0: exchangePullToken,
    //    1: receiverPullToken
    // ] 
    bool[] calldata pull,
    
    // [
    //    0: exchangeCallData,
    //    1: receiverCallData
    // ]
    bytes[] calldata calls,
    
    // timestamp after which the payment will be declined
    uint256 deadline

  ) external payable returns(bool){

    // Make sure payment deadline has not been passed, yet
    require(deadline > block.timestamp, "DePay: Payment deadline has passed!");

    // Store tokenIn balance prior to payment
    uint256 balanceInBefore;
    if(addresses[0] == NATIVE) {
      balanceInBefore = address(this).balance - msg.value;
    } else {
      balanceInBefore = IERC20(addresses[0]).balanceOf(address(this));
    }

    // Store tokenOut balance prior to payment
    uint256 balanceOutBefore;
    if(addresses[2] == NATIVE) {
      balanceOutBefore = address(this).balance - msg.value;
    } else {
      balanceOutBefore = IERC20(addresses[2]).balanceOf(address(this));
    }

    // Make sure that the sender has paid in the correct token & amount
    if(addresses[0] == NATIVE) {
      require(msg.value >= amounts[0], 'DePay: Insufficient amount paid in!');
    } else {
      IERC20(addresses[0]).safeTransferFrom(msg.sender, address(this), amounts[0]);
    }

    // Perform conversion if required
    if(addresses[1] != address(0)) {
      require(exchanges[addresses[1]], 'DePay: Exchange has not been approved!');
      bool success;
      if(addresses[0] == NATIVE) {
        (success,) = addresses[1].call{value: msg.value}(calls[0]);
      } else {
        if(pull[0]) {
          IERC20(addresses[0]).safeApprove(addresses[1], amounts[0]);
        } else { // push
          IERC20(addresses[0]).safeTransfer(addresses[1], amounts[0]);
        }
        (success,) = addresses[1].call(calls[0]);
      }
      require(success, "DePay: exchange call failed!");
    }

    // Pay paymentReceiver
    if(addresses[2] == NATIVE) {
      (bool success,) = addresses[3].call{value: amounts[1]}(new bytes(0));
      require(success, 'DePay: NATIVE payment receiver pay out failed!');
      emit Transfer(msg.sender, addresses[3], amounts[1]);
    } else {
      IERC20(addresses[2]).safeTransfer(addresses[3], amounts[1]);
    }

    // Pay feeReceiver
    if(addresses[4] != address(0)) {
      if(addresses[2] == NATIVE) {
        (bool success,) = addresses[4].call{value: amounts[2]}(new bytes(0));
        require(success, 'DePay: NATIVE fee receiver pay out failed!');
        emit Transfer(msg.sender, addresses[4], amounts[2]);
      } else {
        IERC20(addresses[2]).safeTransfer(addresses[4], amounts[2]);
      }
    }

    // Ensure balances of tokenIn remained
    if(addresses[0] == NATIVE) {
      require(address(this).balance >= balanceInBefore, 'DePay: Insufficient balanceIn after payment!');
    } else {
      require(IERC20(addresses[0]).balanceOf(address(this)) >= balanceInBefore, 'DePay: Insufficient balanceIn after payment!');
    }

    // Ensure balances of tokenOut remained
    if(addresses[2] == NATIVE) {
      require(address(this).balance >= balanceOutBefore, 'DePay: Insufficient balanceOut after payment!');
    } else {
      require(IERC20(addresses[2]).balanceOf(address(this)) >= balanceOutBefore, 'DePay: Insufficient balanceOut after payment!');
    }

    return true;
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

  // Decodes call (to exchange or receiver contract) and determines type (push vs. pull)
  function decodeCall(bytes memory encoded) internal pure returns (bool pull, bytes memory callData) {
    assembly {
      // Load pull
      pull := iszero(iszero(byte(31, mload(encoded))))

      // Load the length of callData, which is found at position encoded + 32.
      let callDataLength := mload(add(encoded, 32))

      // Allocate memory for callData.
      callData := mload(0x40)  // fetch the free memory pointer
      mstore(0x40, add(callData, add(callDataLength, 0x20)))  // adjust the free memory pointer

      // Store the length of callData.
      mstore(callData, callDataLength)

      // Copy callData.
      let callDataStart := add(encoded, 0x40)  // start of 'bytes' data
      for { let end := add(callDataStart, callDataLength) } lt(callDataStart, end) { callDataStart := add(callDataStart, 0x20) } {
        mstore(add(callData, sub(callDataStart, add(encoded, 0x40))), mload(callDataStart))
      }
    }
  }
}
