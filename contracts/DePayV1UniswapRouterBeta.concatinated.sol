// SPDX-License-Identifier: GPL-3.0-only

pragma solidity >= 0.6.0;

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from `ReentrancyGuard` will make the `nonReentrant` modifier
 * available, which can be aplied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note that because there is a single `nonReentrant` guard, functions marked as
 * `nonReentrant` may not call one another. This can be worked around by making
 * those functions `private`, and then adding `external` `nonReentrant` entry
 * points to them.
 */
contract ReentrancyGuard {
    /// @dev counter to allow mutex lock with only one SSTORE operation
    uint256 private _guardCounter;

    constructor () internal {
        // The counter starts at one to prevent changing it from zero to a non-zero
        // value, which is a more expensive operation.
        _guardCounter = 1;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and make it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        _guardCounter += 1;
        uint256 localCounter = _guardCounter;
        _;
        require(localCounter == _guardCounter, "ReentrancyGuard: reentrant call");
    }
}

interface IDePayV1RouterBeta {
  
    function swap(
        address[] calldata path,
        uint amountIn,
        uint amountOut
    ) external returns(uint);
    
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
    ) external override nonReentrant returns(uint) {
        uint[] memory amounts = _swap(path, amountIn, amountOut);
        return amounts[0];
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
    
    function _swap(
        address[] memory path,
        uint amountIn,
        uint amountOut
    ) private returns(uint[] memory) {
        if(path[0] == ZERO) {
            return IUniswapV2Router01(UniswapV2Router02).swapExactETHForTokens{value: msg.value}(
                amountOut,
                path,
                msg.sender,
                deadline()
            );
        } else if (path[path.length-1] == ZERO) {
            return IUniswapV2Router01(UniswapV2Router02).swapExactTokensForETH(
                amountIn,
                amountOut,
                path,
                msg.sender,
                deadline()
            );
        } else {
            return IUniswapV2Router01(UniswapV2Router02).swapExactTokensForTokens(
                amountIn,
                amountOut,
                path,
                msg.sender,
                deadline()
            );
        }
    }
}
