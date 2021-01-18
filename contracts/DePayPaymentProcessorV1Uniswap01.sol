// SPDX-License-Identifier: MIT

pragma solidity >=0.7.5 <0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./interfaces/IUniswapV2Router02.sol";

contract DePayPaymentProcessorV1Uniswap01 {
  
  using SafeMath for uint;

  // Address ZERO indicating ETH transfer, because ETH does not have an address like other tokens
  address private ZERO = 0x0000000000000000000000000000000000000000;

  // The maximum integer used for approvals
  uint private MAXINT = (2**256)-1;

  address public immutable WETH;
  address public immutable UniswapV2Router02;

  // gas safe transfer of tokens (see: https://github.com/Uniswap/uniswap-v2-core/blob/master/contracts/UniswapV2Pair.sol#L44)
  bytes4 private constant SELECTOR = bytes4(keccak256(bytes('transfer(address,uint256)')));

  constructor (
    address _WETH,
    address _UniswapV2Router02
  ) public {
    WETH = _WETH;
    UniswapV2Router02 = _UniswapV2Router02;
  }

  function process(
    address[] calldata path,
    uint amountIn,
    uint amountOut
  ) external payable returns(bool) {
    if( 
      path[0] != ZERO &&
      IERC20(path[0]).allowance(address(this), UniswapV2Router02) < amountIn
    ) {
      IERC20(path[0]).approve(UniswapV2Router02, MAXINT-1);
    }

    if(path[0] == ZERO) {
        // IUniswapV2Router01(UniswapV2Router02).swapExactETHForTokens{value: amountIn}(
        //     amountOut,
        //     path,
        //     address(this),
        //     MAXINT-1
        // );
    } else if (path[path.length-1] == ZERO) {
        // IUniswapV2Router01(UniswapV2Router02).swapExactTokensForETH(
        //     amountIn,
        //     amountOut,
        //     path,
        //     address(this),
        //     MAXINT-1
        // );
    } else {
      IUniswapV2Router02(UniswapV2Router02).swapExactTokensForTokens(
        amountIn,
        amountOut,
        path,
        address(this),
        MAXINT-1
      );
    }

    return true;
  }
}
