// SPDX-License-Identifier: MIT

pragma solidity >=0.8.6 <0.9.0;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import './interfaces/IDePayRouterV1Plugin.sol';
import './libraries/Helper.sol';
import './DePayRouterV1Configuration.sol';

contract DePayRouterV1 {
  
  using SafeMath for uint;
  using SafeERC20 for IERC20;

  // Address representating ETH (e.g. in payment routing paths)
  address public constant ETH = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

  // Instance of DePayRouterV1Configuration
  DePayRouterV1Configuration public immutable configuration;

  // Pass immutable instance to configuration.
  // This protects from potential delegatecall and access overlay attacks:
  // https://github.com/DePayFi/depay-ethereum-payments/blob/master/docs/Audit3.md#H02
  constructor (
    address _configuration
  ) {
    configuration = DePayRouterV1Configuration(_configuration);
  }

  // Proxy modifier to DePayRouterV1Configuration
  modifier onlyOwner() {
    require(configuration.owner() == msg.sender, "Ownable: caller is not the owner");
    _;
  }

  receive() external payable {
    // Accepts ETH payments which is require in order
    // to swap from and to ETH
    // especially unwrapping WETH as part of token swaps.
  }

  // The main function to route transactions.
  function route(
    // The path of the token conversion.
    address[] calldata path,
    // Amounts passed to proccessors:
    // e.g. [amountIn, amountOut, deadline]
    uint[] calldata amounts,
    // Addresses passed to plugins:
    // e.g. [receiver]
    address[] calldata addresses,
    // List and order of plugins to be executed for this payment:
    // e.g. [Uniswap,paymentPlugin] to swap and pay
    address[] calldata plugins,
    // Data passed to plugins:
    // e.g. ["signatureOfSmartContractFunction(address,uint)"] receiving the payment
    string[] calldata data
  ) external payable returns(bool) {
    uint balanceBefore = _balanceBefore(path[path.length-1]);
    _ensureTransferIn(path[0], amounts[0]);
    _execute(path, amounts, addresses, plugins, data);
    _ensureBalance(path[path.length-1], balanceBefore);
    return true;
  }

  // Returns the balance for a token (or ETH) before the payment is executed.
  // In case of ETH we need to deduct what has been payed in as part of the transaction itself.
  function _balanceBefore(address token) private returns (uint balance) {
    balance = _balance(token);
    if(token == ETH) { balance -= msg.value; }
  }

  // This makes sure that the sender has payed in the token (or ETH)
  // required to perform the payment.
  function _ensureTransferIn(address tokenIn, uint amountIn) private {
    if(tokenIn == ETH) { 
      require(msg.value >= amountIn, 'DePay: Insufficient amount payed in!'); 
    } else {
      Helper.safeTransferFrom(tokenIn, msg.sender, address(this), amountIn);
    }
  }

  // Executes plugins in the given order.
  function _execute(
    address[] calldata path,
    uint[] calldata amounts,
    address[] calldata addresses,
    address[] calldata plugins,
    string[] calldata data
  ) internal {
    for (uint i = 0; i < plugins.length; i++) {
      require(_isApproved(plugins[i]), 'DePay: Plugin not approved!');
      
      IDePayRouterV1Plugin plugin = IDePayRouterV1Plugin(configuration.approvedPlugins(plugins[i]));

      if(plugin.delegate()) {
        (bool success, bytes memory returnData) = address(plugin).delegatecall(abi.encodeWithSelector(
            plugin.execute.selector, path, amounts, addresses, data
        ));
        require(success, string(returnData));
      } else {
        (bool success, bytes memory returnData) = address(plugin).call(abi.encodeWithSelector(
            plugin.execute.selector, path, amounts, addresses, data
        ));
        require(success, string(returnData));
      }
    }
  }

  // This makes sure that the balance after the payment not less than before.
  // Prevents draining of the contract.
  function _ensureBalance(address tokenOut, uint balanceBefore) private view {
    require(_balance(tokenOut) >= balanceBefore, 'DePay: Insufficient balance after payment!');
  }

  // Returns the balance of the payment plugin contract for a token (or ETH).
  function _balance(address token) private view returns(uint) {
    if(token == ETH) {
        return address(this).balance;
    } else {
        return IERC20(token).balanceOf(address(this));
    }
  }

  // Function to check if a plugin address is approved.
  function isApproved(
    address pluginAddress
  ) external view returns(bool){
    return _isApproved(pluginAddress);
  }

  // Internal function to check if a plugin address is approved.
  function _isApproved(
    address pluginAddress
  ) internal view returns(bool) {
    return (configuration.approvedPlugins(pluginAddress) != address(0));
  }
  
  // Allows to withdraw accidentally sent ETH or tokens.
  function withdraw(
    address token,
    uint amount
  ) external onlyOwner returns(bool) {
    if(token == ETH) {
      Helper.safeTransferETH(payable(configuration.owner()), amount);
    } else {
      Helper.safeTransfer(token, payable(configuration.owner()), amount);
    }
    return true;
  }
}
