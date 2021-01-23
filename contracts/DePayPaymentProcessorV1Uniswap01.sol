// SPDX-License-Identifier: MIT

pragma solidity >=0.7.5 <0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./interfaces/IUniswapV2Router02.sol";
import './libraries/TransferHelper.sol';

contract DePayPaymentProcessorV1Uniswap01 {
  
  using SafeMath for uint;

  uint public immutable MAXINT = type(uint256).max;
  address public immutable ZERO = 0x0000000000000000000000000000000000000000;
  address public immutable WETH;
  address public immutable UniswapV2Router02;

  constructor (
    address _WETH,
    address _UniswapV2Router02
  ) public {
    WETH = _WETH;
    UniswapV2Router02 = _UniswapV2Router02;
  }

  function process(
    address[] calldata path,
    uint[] calldata amounts,
    address[] calldata addresses,
    string[] calldata data
  ) external payable returns(bool) {
    
    if( 
      path[0] != ZERO &&
      IERC20(path[0]).allowance(address(this), UniswapV2Router02) < amounts[0]
    ) {
      TransferHelper.safeApprove(path[0], UniswapV2Router02, MAXINT);
    }

    address[] memory uniPath = new address[](path.length);
    for (uint i=0; i<path.length; i++) {
        if(path[i] == ZERO) {
            uniPath[i] = WETH;
        } else {
            uniPath[i] = path[i];
        }
    }

    if(path[0] == ZERO) {
      IUniswapV2Router01(UniswapV2Router02).swapExactETHForTokens{value: amounts[0]}(
        amounts[1],
        uniPath,
        address(this),
        amounts[2]
      );
    } else if (path[path.length-1] == ZERO) {
      IUniswapV2Router01(UniswapV2Router02).swapExactTokensForETH(
        amounts[0],
        amounts[1],
        uniPath,
        address(this),
        amounts[2]
      );
    } else {
      IUniswapV2Router02(UniswapV2Router02).swapExactTokensForTokens(
        amounts[0],
        amounts[1],
        uniPath,
        address(this),
        amounts[2]
      );
    }

    return true;
  }
}
