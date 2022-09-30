// SPDX-License-Identifier: MIT

pragma solidity >=0.8.6 <0.9.0;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import './libraries/Helper.sol';
import "hardhat/console.sol";

contract DePayRouterV1ApproveAndCallContractAmountsAddressesAddressesAddressesBytes {

  // Address representating NATIVE currency
  address public constant NATIVE = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

  // Indicates that this plugin requires delegate call
  bool public immutable delegate = true;
  
  // Call another smart contract to deposit an amount for a given address while making sure the amount passed to the contract is approved.
  //
  // Approves the amount at index 1 of amounts (amounts[1])
  // for the token at the last position of path (path[path.length-1])
  // to be used by the smart contract at index 1 of addresses (addresses[1]).
  // 
  // Afterwards, calls the smart contract at index 1 of addresses (addresses[1]),
  // passing the address at index 0 of addresses (addresses[0])
  // and passing the amount at index 1 of amounts (amounts[1])
  // to the method with the signature provided in data at index 0 (data[0]).
  function execute(
    address[] calldata path,
    uint[] calldata amounts,
    address[] calldata addresses,
    string[] calldata data
  ) external payable returns(bool) {

    // Approve the amount that needs to be passed on to the smart contract.
    if(path[path.length-1] != NATIVE) {
      Helper.safeApprove(
        path[path.length-1],
        addresses[1],
        amounts[1]
      );
    }

    // Call the smart contract which is receiver of the payment.
    bytes memory returnData;
    bool success = true;

    if(path[path.length-1] == NATIVE) {
      // Make sure to send the NATIVE along with the call in case of sending NATIVE.
      console.log("data[0]", data[0]);
      console.log("addresses[1]", addresses[1]);
      console.log("amounts[1]", amounts[1]);
      console.log("amounts[5]", amounts[5]);
      console.log("addresses[2]", addresses[2]);
      console.log("addresses[3]", addresses[3]);
      console.log("addresses[4]", addresses[4]);
      (success, returnData) = addresses[1].call{value: amounts[1]}(
        abi.encodeWithSignature(
          data[0],
          [amounts[5]],
          [addresses[2]],
          [addresses[3]],
          [addresses[4]],
          [""]
        )
      );
    } else {
      (success, returnData) = addresses[1].call(
        abi.encodeWithSignature(
          data[0],
          [amounts[5]],
          [addresses[2]],
          [addresses[3]],
          [addresses[4]],
          [bytes(data[1])]
        )
      );
    }

    // Reset allowance after paying to the smart contract
    if(path[path.length-1] != NATIVE && IERC20(path[path.length-1]).allowance(address(this), addresses[1]) > 0) {
      Helper.safeApprove(
        path[path.length-1],
        addresses[1],
        0
      ); 
    }

    assembly {
      let returndata_size := mload(returnData)
      revert(add(32, returnData), returndata_size)
    }
    Helper.verifyCallResult(success, returnData, "Calling smart contract payment receiver failed!");
    return true;
  }
}
