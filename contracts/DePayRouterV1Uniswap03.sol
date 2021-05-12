// SPDX-License-Identifier: MIT

pragma solidity >=0.7.5 <0.8.0;
pragma abicoder v2;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';
import './interfaces/IUniswapV3Router03.sol';
import './interfaces/IWETH.sol';
import './libraries/Helper.sol';

contract DePayRouterV1Uniswap03 {
  using SafeMath for uint256;

  // Address representating ETH (e.g. in payment routing paths)
  address public constant ETH = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

  // MAXINT to be used only, to increase allowance from
  // payment protocol contract towards known
  // decentralized exchanges, not to dyanmically called contracts!!!
  uint256 public immutable MAXINT = type(uint256).max;

  // Address of WETH.
  address public immutable WETH;

  // Address of Uniswap router.
  address public immutable UniswapV3Router03;

  // Indicates that this plugin requires delegate call
  bool public immutable delegate = true;

  // Pass WETH and the UniswapRouter when deploying this contract.
  constructor(address _WETH, address _UniswapV3Router03) public {
    WETH = _WETH;
    UniswapV3Router03 = _UniswapV3Router03;
  }

  // Swap tokenA<>tokenB, ETH<>tokenA or tokenA<>ETH on Uniswap as part of the payment.
  // Swaps tokens according to provided `path` using the amount at index 0 (`amounts[0]`) as input amount,
  // the amount at index 1 (`amounts[1]`) as output amount and the amount at index 2 (`amount[2]`) as deadline.
  function execute(
    address[] calldata path,
    uint256[] calldata amounts,
    address[] calldata addresses,
    string[] calldata data
  ) external payable returns (bool) {
    // Make sure swapping the token within the payment protocol contract is approved on the Uniswap router.
    if (path[0] != ETH && IERC20(path[0]).allowance(address(this), UniswapV3Router03) < amounts[0]) {
      Helper.safeApprove(path[0], UniswapV3Router03, MAXINT);
    }

    // Uniswap uses WETH within their path to indicate bridge swapping (instead of ETH).
    // This prepares the path as applicable to the Uniswap router.
    address[] memory uniPath = new address[](path.length);
    for (uint256 i = 0; i < path.length; i++) {
      if (path[i] == ETH) {
        uniPath[i] = WETH;
      } else {
        uniPath[i] = path[i];
      }
    }

    IUniswapV3Router03.ExactInputSingleParams memory singleSwap;

    singleSwap.tokenIn = uniPath[0];
    singleSwap.tokenOut = uniPath[uniPath.length - 1];
    // We packing fee and sqrtPriceLimitX96 in amount[2]
    // [20 bytes][12 bytes]
    // First 20 bytes (160 bits) is sqrtPriceLimitX96
    // Next 12 bytes contain 3 bytes (24 bits) fee level
    singleSwap.fee = uint24(amounts[2]);
    singleSwap.sqrtPriceLimitX96 = uint160(amounts[2] >> 96);
    singleSwap.amountIn = amounts[0];
    singleSwap.amountOutMinimum = amounts[1];
    singleSwap.deadline = amounts[3];
    singleSwap.recipient = address(this);

    // Executes ETH<>tokenA, tokenA<>ETH, or tokenA<>tokenB swaps depending on the provided path.
    if (path[0] == ETH) {
      // Swap WETH for ETH
      IWETH(WETH).deposit{value: amounts[0]}();
      Helper.safeApprove(WETH, UniswapV3Router03, MAXINT);
      IUniswapV3Router03(UniswapV3Router03).exactInputSingle(singleSwap);
      return true;
    } else {
      uint256 amountOut = IUniswapV3Router03(UniswapV3Router03).exactInputSingle(singleSwap);
      // If output is WETH swap it for ETH
      if (path[path.length - 1] == ETH) {
        IWETH(WETH).withdraw(amountOut);
      }
      return true;
    }

    revert('DePayRouterV1Uniswap03: Unexpected error happened, we not able to swap token');
  }
}
