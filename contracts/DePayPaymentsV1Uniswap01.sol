// SPDX-License-Identifier: MIT

pragma solidity >=0.7.5 <0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./interfaces/IUniswapV2Router02.sol";
import './libraries/TransferHelper.sol';

contract DePayPaymentsV1Uniswap01 {
  
  using SafeMath for uint;

  // MAXINT to be used only, to increase allowance from
  // payment protocol contract towards known 
  // decentralized exchanges, not to dyanmically called contracts!!!
  uint public immutable MAXINT = type(uint256).max;
  
  // Address ZERO indicates ETH transfers.  
  address public immutable ZERO = address(0);

  // Address of WETH.
  address public immutable WETH;

  // Address of Uniswap router.
  address public immutable UniswapV2Router02;

  // Pass WETH and the UniswapRouter when deploying this contract.
  constructor (
    address _WETH,
    address _UniswapV2Router02
  ) public {
    WETH = _WETH;
    UniswapV2Router02 = _UniswapV2Router02;
  }

  // Swap tokenA<>tokenB, ETH<>tokenA or tokenA<>ETH on Uniswap as part of the payment.
  // Swaps tokens according to provided `path` using the amount at index 0 (`amounts[0]`) as input amount,
  // the amount at index 1 (`amounts[1]`) as output amount and the amount at index 2 (`amount[2]`) as deadline.
  function execute(
    address[] calldata path,
    uint[] calldata amounts,
    address[] calldata addresses,
    string[] calldata data
  ) external payable returns(bool) {
    
    // Make sure swapping the token within the payment protocol contract is approved on the Uniswap router.
    if( 
      path[0] != ZERO &&
      IERC20(path[0]).allowance(address(this), UniswapV2Router02) < amounts[0]
    ) {
      TransferHelper.safeApprove(path[0], UniswapV2Router02, MAXINT);
    }

    // Uniswap uses WETH within their path to indicate bridge swapping (instead of ZERO).
    // This prepares the path as applicable to the Uniswap router.
    address[] memory uniPath = new address[](path.length);
    for (uint i=0; i<path.length; i++) {
        if(path[i] == ZERO) {
            uniPath[i] = WETH;
        } else {
            uniPath[i] = path[i];
        }
    }

    // Executes ETH<>tokenA, tokenA<>ETH, or tokenA<>tokenB swaps depending on the provided path.
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
