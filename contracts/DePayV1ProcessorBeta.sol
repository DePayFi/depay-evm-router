// SPDX-License-Identifier: GPL-3.0-only

pragma solidity >= 0.6.0;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v3.2.0/contracts/token/ERC20/ERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v3.2.0/contracts/utils/ReentrancyGuard.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v3.2.0/contracts/access/Ownable.sol";

interface IDePayV1ProcessorBeta {
    
    event BalanceDebug(
        address[] path,
        uint balanceBefore,
        uint balanceAfter
    );
    
    event Payment(
        uint indexed id,
        address indexed sender,
        address payable indexed receiver
    );

   function pay(
        address[] calldata path,
        uint amountIn,
        uint amountOut,
        address payable receiver,
        uint id
    ) external payable;

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

contract DePayV1ProcessorBeta is IDePayV1ProcessorBeta, Ownable, ReentrancyGuard {
    
    address[] public routers;
    address private ZERO = 0x0000000000000000000000000000000000000000;
    uint private MAXINT = 115792089237316195423570985008687907853269984665640564039457584007913129639935;
    address public UniswapV2Router02 = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    address public WETH = 0xc778417E063141139Fce010982780140Aa0cD5Ab;
    
    receive() external payable {
        // accepts eth payments which are required to
        // swap and pay from ETH to any token
    }

    function pay(
        address[] calldata path,
        uint amountIn,
        uint amountOut,
        address payable receiver,
        uint id
    ) external payable override nonReentrant {
        if(path[0] == ZERO) { require(msg.value >= amountIn, 'DePay: Insufficient amount payed in.'); }
        
        if(path.length <= 1) {
            _pay(receiver, msg.sender, path[0], amountOut);
        } else {
            transferIn(path[0], amountIn);
            swap(path, amountIn, amountOut);
            _pay(receiver, address(this), path[path.length-1], amountOut);
        }
        
        emit Payment(id, msg.sender, receiver);
    }
    
    function transferIn(address token, uint amount) private {
        if(token != ZERO) {
            ERC20(token).transferFrom(msg.sender, address(this), amount);
        }
    }
    
    function swap(address[] memory path, uint amountIn, uint amountOut) private {
        uint balanceBefore = balance(path[path.length-1]);
        swapOnUniswap(path, amountIn, amountOut);
        require(balance(path[path.length-1]) >= (balanceBefore + amountOut), 'DePay: Insufficient balance after swap.');
    }
    
    function swapOnUniswap(address[] memory path, uint amountIn, uint amountOut) private {
        address[] memory uniPath = new address[](path.length);
        for (uint i=0; i<path.length; i++) {
            if(path[i] == ZERO) {
                uniPath[i] = WETH;
            } else {
                uniPath[i] = path[i];
            }
        }

        if( 
            path[0] != ZERO &&
            ERC20(path[0]).allowance(address(this), UniswapV2Router02) < amountIn 
        ) {
            ERC20(path[0]).approve(UniswapV2Router02, MAXINT);
        }

        if(path[0] == ZERO) {
            IUniswapV2Router01(UniswapV2Router02).swapExactETHForTokens{value: amountIn}(
                amountOut,
                uniPath,
                address(this),
                swapDeadline()
            );
        } else if (path[path.length-1] == ZERO) {
            IUniswapV2Router01(UniswapV2Router02).swapExactTokensForETH(
                amountIn,
                amountOut,
                uniPath,
                address(this),
                swapDeadline()
            );
        } else {
            IUniswapV2Router01(UniswapV2Router02).swapExactTokensForTokens(
                amountIn,
                amountOut,
                uniPath,
                address(this),
                swapDeadline()
            );
        }
    }
    
    function swapDeadline() private view returns(uint) {
        return block.timestamp + 60 minutes;
    }
    
    function balance(address token) private view returns(uint) {
        if(token == ZERO) {
            return address(this).balance;
        } else {
            return ERC20(token).balanceOf(address(this));
        }
    }
    
    function _pay(address payable receiver, address from, address token, uint amount) private {
        if(token == ZERO) {
            receiver.transfer(amount);
        } else {
            if(from == address(this)) {
                ERC20(token).transfer(receiver, amount);
            } else {
                ERC20(token).transferFrom(from, receiver, amount);
            }
        }
    }

    function payableOwner() view private returns(address payable) {
        return address(uint160(owner()));
    }
    
    function withdraw(address tokenAddress, uint amount) external onlyOwner nonReentrant {
        if(tokenAddress == ZERO) {
            payableOwner().transfer(amount);
        } else {
            ERC20(tokenAddress).transfer(payableOwner(), amount);
        }
    }
    
    function destroy() external onlyOwner {
        selfdestruct(payableOwner());
    }
}
