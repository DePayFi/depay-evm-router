// SPDX-License-Identifier: MIT

pragma solidity >=0.8.6 <0.9.0;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./interfaces/IPancakeRouter02.sol";
import './libraries/Helper.sol';

contract DePayRouterV1PancakeSwap01 {
  
  using SafeMath for uint;

  // Address representating NATIVE token (e.g. in payment routing paths)
  address public constant NATIVE = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

  // MAXINT to be used only, to increase allowance from
  // payment protocol contract towards known 
  // decentralized exchanges, not to dyanmically called contracts!!!
  uint public immutable MAXINT = type(uint256).max;
  
  // Address of WRAPPED NATIVE token.
  address public immutable WRAPPED;

  // Address of router.
  address public immutable ROUTER;

  // Indicates that this plugin requires delegate call
  bool public immutable delegate = true;

  // Pass address of WRAPPED native token and the router when deploying this contract.
  constructor (
    address _WRAPPED,
    address _ROUTER
  ) {
    WRAPPED = _WRAPPED;
    ROUTER = _ROUTER;
  }

  // Swap tokenA<>tokenB, NATIVE<>tokenA or tokenA<>NATIVE as part of the payment.
  // Swaps tokens according to provided `path` using the amount at index 0 (`amounts[0]`) as input amount,
  // the amount at index 1 (`amounts[1]`) as output amount and the amount at index 2 (`amount[2]`) as deadline.
  function execute(
    address[] calldata path,
    uint[] calldata amounts,
    address[] calldata addresses,
    string[] calldata data
  ) external payable returns(bool) {
    
    // Make sure swapping the token within the payment protocol contract is approved towards the router.
    if( 
      path[0] != NATIVE &&
      IERC20(path[0]).allowance(address(this), ROUTER) < amounts[0]
    ) {
      Helper.safeApprove(path[0], ROUTER, MAXINT);
    }

    // Router uses WRAPPED native token to convert NATIVE to other tokens
    address[] memory fixedPath = new address[](path.length);
    for (uint i=0; i<path.length; i++) {
        if(path[i] == NATIVE) {
            fixedPath[i] = WRAPPED;
        } else {
            fixedPath[i] = path[i];
        }
    }

    if(path[0] == NATIVE) {
      IPancakeRouter02(ROUTER).swapExactETHForTokens{value: amounts[0]}(
        amounts[1],
        fixedPath,
        address(this),
        amounts[2]
      );
    } else if (path[path.length-1] == NATIVE) {
      IPancakeRouter02(ROUTER).swapExactTokensForETH(
        amounts[0],
        amounts[1],
        fixedPath,
        address(this),
        amounts[2]
      );
    } else {
      IPancakeRouter02(ROUTER).swapExactTokensForTokens(
        amounts[0],
        amounts[1],
        fixedPath,
        address(this),
        amounts[2]
      );
    }

    return true;
  }
}
