// SPDX-License-Identifier: GPL-3.0-only

pragma solidity >= 0.6.0;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v3.2.0/contracts/utils/ReentrancyGuard.sol";

interface IDePayV1RouterBeta {
    
    event SwapDebug(
        address[] path,
        uint amountIn,
        uint amountOut
    );
  
    function swap(
        address[] calldata path,
        uint amountIn,
        uint amountOut
    ) external;
    
    function contractAddress() external view returns(address);
    
    function requiresApproval(address[] calldata path) external view returns(address[] memory);
  
}

interface IUniswapV2Router01 {
    
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    
    function swapExactTokensForETH(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
    uint deadline
    ) external returns (uint[] memory amounts);
        
    function swapExactETHForTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable returns (uint[] memory amounts);
    
}

contract DePayV1UniswapRouterBeta is IDePayV1RouterBeta, ReentrancyGuard {

  address public UniswapV2Router02 = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
  address private ZERO = 0x0000000000000000000000000000000000000000;
    
    function swap(
        address[] calldata path,
        uint amountIn,
        uint amountOut
    ) external override nonReentrant {
        emit SwapDebug(path, amountIn, amountOut);
    }
    
    function contractAddress() external view override returns(address) {
        return UniswapV2Router02;
    }
    
    function requiresApproval(address[] calldata path) external view override returns(address[] memory) {
        address[] memory addresses;
        if(path[0] != ZERO) {
            addresses[0] = path[0];
        }
        return addresses;
    }
    
    function deadline() private view returns(uint) {
        block.timestamp + 60 minutes;
    }
    
}
