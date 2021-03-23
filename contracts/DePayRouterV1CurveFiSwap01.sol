// SPDX-License-Identifier: MIT

pragma solidity >=0.7.5 <0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import './interfaces/ICurveFiSwap.sol';
import './libraries/Helper.sol';

contract DePayRouterV1CurveFiSwap01 {
  
  using SafeMath for uint;

  // Address representating ETH (e.g. in payment routing paths)
  address public constant ETH = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

  // MAXINT to be used only, to increase allowance from
  // payment protocol contract towards known 
  // decentralized exchanges, not to dyanmically called contracts!!!
  uint public immutable MAXINT = type(uint256).max;
  
  // Address of Synth sETH (sETH).
  // They're mostly using sETH
  // https://etherscan.io/address/0x5e74C9036fb86BD7eCdcb084a0673EFc32eA31cb
  address public immutable SETH;

  // Address of CurveFiSwap
  address public immutable CurveFiSwap;

  // Indicates that this plugin requires delegate call
  bool public immutable delegate = true;

  // Pass SETH and the _CurveFiSwap when deploying this contract.
  constructor ( address _SETH, address _CurveFiSwap) {
    SETH = _SETH;
    CurveFiSwap = _CurveFiSwap;
  }

  // Swap tokenA<>tokenB, ETH<>sETH or sETH<>ETH on CureFi.
  //
  // path -> [from, to]
  // amounts -> [amount, expected]
  // addresses -> [pool]
  //
  //  function exchange(
  //      address _pool,      # Pool address, could able to get from 
  //      address _from,      # From token address
  //      address _to,        # To token address
  //      uint256 _amount,    # Amount
  //      uint256 _expected,  # Minimum amount of from token, like you expect to exchange for 1 USDT
  //      address _receiver,  # Receiver address
  //  ) payable returns (uint256);
  //
  function execute(
    address[] calldata path,
    uint[] calldata amounts,
    address[] calldata addresses,
    string[] calldata data
  ) external payable returns(bool) {
    // Make sure swapping the token within the payment protocol contract is approved on the CurveFiSwap.
    if( 
      // from != ETH address
      path[0] != ETH &&
      IERC20(path[0]).allowance(address(this), CurveFiSwap) < amounts[0]
    ) {
      // Allow CurveFi transfer token
      Helper.safeApprove(path[0], CurveFiSwap, MAXINT);
    }

    // From token is ETH, 
    if(path[0] == ETH) {
      ICurveFiSwap(CurveFiSwap).exchange{value: amounts[0]}(
        addresses[0], // pool
        path[0],      // from token
        path[1],      // to token
        amounts[0],   // amount
        amounts[1],   // expected
        address(this) // receiver
      );
    } else {
      ICurveFiSwap(CurveFiSwap).exchange(
        addresses[0], // pool
        path[0],      // from token
        path[1],      // to token
        amounts[0],   // amount
        amounts[1],   // expected
        address(this) // receiver
      );
    }

    return true;
  }
}

