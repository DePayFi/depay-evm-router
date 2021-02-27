// SPDX-License-Identifier: MIT

pragma solidity >=0.7.5 <0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import './libraries/Helper.sol';

contract DePayRouterV1ApproveAndCallContractAddressAmount01 {

  // Address representating ETH (e.g. in payment routing paths)
  address public constant ETH = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

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

    // Approve the amount to be passed to the smart contract be called.
    if(path[path.length-1] != ETH) {
      Helper.safeApprove(
        path[path.length-1],
        addresses[1],
        amounts[1]
      );
    }

    // Call the smart contract which is receiver of the payment.
    bytes memory returnData;
    bool success;
    if(path[path.length-1] == ETH) {
      // Make sure to send the ETH along with the call in case of sending ETH.
      (success, returnData) = addresses[1].call{value: amounts[1]}(
        abi.encodeWithSignature(
          data[0],
          addresses[0],
          amounts[1]
        )
      );
    } else {
      (success, returnData) = addresses[1].call(
        abi.encodeWithSignature(
          data[0],
          addresses[0],
          amounts[1]
        )
      );
    }

    require(success, string(returnData));
    return true;
  }
}
