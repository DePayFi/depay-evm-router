// SPDX-License-Identifier: MIT

pragma solidity >=0.7.5 <0.8.0;
pragma abicoder v2;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';
import './interfaces/IOneSplitAudit.sol';
import './libraries/Helper.sol';

contract DePayRouterV1OneInchSwap01 {
  using SafeMath for uint256;

  // Address representating ETH (e.g. in payment routing paths)
  address public constant ETH = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

  // MAXINT to be used only, to increase allowance from
  // payment protocol contract towards known
  // decentralized exchanges, not to dyanmically called contracts!!!
  uint256 public immutable MAXINT = type(uint256).max;

  // Address of OneSplitAudit
  address public immutable OneSplitAudit;

  // Indicates that this plugin requires delegate call
  bool public immutable delegate = true;

  receive() external payable {}

  // Pass _OneSplitAudit when deploying this contract.
  constructor(address _OneSplitAudit) {
    OneSplitAudit = _OneSplitAudit;
  }

  function _getDistribution(uint256[] calldata amounts) internal returns (uint256[] memory buf) {
    uint256 len = amounts.length - 3;
    buf = new uint256[](len);
    for (uint256 i = 0; i < len; i += 1) {
      buf[i] = amounts[3 + i];
    }
  }

  // Swap tokenA<>tokenB, ETH<>ERC20 or ERC20<>ETH on 1Inch.
  //  function swap(
  //      IERC20 fromToken,
  //      IERC20 destToken,
  //      uint256 amount,
  //      uint256 minReturn,
  //      uint256[] memory distribution,
  //      uint256 flags // See contants in IOneSplit.sol
  //  ) public returns (uint256);
  function execute(
    address[] calldata path,
    uint256[] calldata amounts,
    address[] calldata addresses,
    string[] calldata data
  ) external payable returns (bool) {
    // Make sure swapping the token within the payment protocol contract is approved on the OneSplitAudit.
    if ((path[0] != ETH) && IERC20(path[0]).allowance(address(this), OneSplitAudit) < amounts[0]) {
      // Allow OneSplitAudit transfer token
      Helper.safeApprove(path[0], OneSplitAudit, MAXINT);
    }

    IOneSplitAudit oneSplit = IOneSplitAudit(OneSplitAudit);

    // From token is ETH,
    if (path[0] == ETH) {
        address(OneSplitAudit).call{value: amounts[0]}(
            abi.encodeWithSelector(
                oneSplit.swap.selector,
                path[0],
                path[1],
                amounts[0],
                amounts[1],
                _getDistribution(amounts),
                amounts[2]
            )
        );
    } else {
        address(OneSplitAudit).call(
            abi.encodeWithSelector(
                oneSplit.swap.selector,
                path[0],
                path[1],
                amounts[0],
                amounts[1],
                _getDistribution(amounts),
                amounts[2]
            )
        );
    }
    return false;
  }
}
