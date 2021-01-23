// SPDX-License-Identifier: MIT

pragma solidity >=0.7.5 <0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import './libraries/TransferHelper.sol';

contract DePayPaymentProcessorV1ContractCallPreApproveAmountAddress01 {
  
  uint public immutable MAXINT = type(uint256).max;
  address public immutable ZERO = 0x0000000000000000000000000000000000000000;

  function process(
    address[] calldata path,
    uint[] calldata amounts,
    address[] calldata addresses,
    string[] calldata data
  ) external payable returns(bool) {

    if( 
      path[path.length-1] != ZERO &&
      IERC20(path[path.length-1]).allowance(address(this), addresses[0]) < amounts[1]
    ) {
      TransferHelper.safeApprove(path[path.length-1], addresses[0], MAXINT);
    }
    
    bytes memory returnData; 
    bool success;   
    if(path[path.length-1] == ZERO) {
      (success, returnData) = addresses[0].call{value: amounts[1]}(
        abi.encodeWithSignature(
          data[0],
          amounts[1],
          addresses[1]
        )
      );
    } else {
      (success, returnData) = addresses[0].call(
        abi.encodeWithSignature(
          data[0],
          amounts[1],
          addresses[1]
        )
      );
    }

    require(success, string(returnData));
    return true;
  }
}
