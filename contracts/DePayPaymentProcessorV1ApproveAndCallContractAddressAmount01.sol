// SPDX-License-Identifier: MIT

pragma solidity >=0.7.5 <0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import './libraries/TransferHelper.sol';

contract DePayPaymentProcessorV1ApproveAndCallContractAddressAmount01 {
  
  address public immutable ZERO = address(0);

  function process(
    address[] calldata path,
    uint[] calldata amounts,
    address[] calldata addresses,
    string[] calldata data
  ) external payable returns(bool) {

    if(path[path.length-1] != ZERO) {
      TransferHelper.safeApprove(
        path[path.length-1],
        addresses[1],
        amounts[1]
      );
    }

    bytes memory returnData;
    bool success;
    if(path[path.length-1] == ZERO) {
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
