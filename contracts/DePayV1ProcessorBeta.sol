// SPDX-License-Identifier: GPL-3.0-only

pragma solidity >= 0.6.0;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v3.2.0/contracts/token/ERC20/ERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v3.2.0/contracts/utils/ReentrancyGuard.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v3.2.0/contracts/access/Ownable.sol";

interface IDePayV1ProcessorBeta {
    
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
        uint id,
        uint routerId
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

interface IMooniswap {
    
    function swap(
        address fromToken,
        address toToken,
        uint256 amount, 
        uint256 minReturn, 
        address referrer
    ) external payable returns(uint256 result);
    
}

contract DePayV1ProcessorBeta is IDePayV1ProcessorBeta, Ownable, ReentrancyGuard {
    
    address[] public routers;
    address private ZERO = 0x0000000000000000000000000000000000000000;
    uint private MAXINT = 115792089237316195423570985008687907853269984665640564039457584007913129639935;
    address public UniswapV2Router02 = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    address public Mooniswap = 0x798934cdcfAe18764ef4819274687Df3fB24B99B;
    address public WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    
    receive() external payable {
        // accepts eth payments which are required to
        // swap and pay from ETH to any token
    }

    function pay(
        address[] calldata path,
        uint amountIn,
        uint amountOut,
        address payable receiver,
        uint id,
        uint routerId
    ) external payable override nonReentrant {
        if(path[0] == ZERO) { require(msg.value >= amountIn, 'DePay: Insufficient amount payed in.'); }
        
        if(path.length <= 1) {
            _pay(receiver, msg.sender, path[0], amountOut);
        } else {
            transferIn(path[0], amountIn);
            swap(path, amountIn, amountOut, routerId);
            _pay(receiver, address(this), path[path.length-1], amountOut);
        }
        
        emit Payment(id, msg.sender, receiver);
    }
    
    function transferIn(address token, uint amount) private {
        if(token != ZERO) {
            ERC20(token).transferFrom(msg.sender, address(this), amount);
        }
    }
    
    function swap(address[] memory path, uint amountIn, uint amountOut, uint routerId) private {
        uint balanceBefore = balance(path[path.length-1]);
        
        if(routerId == 0) {
            swapOnUniswap(path, amountIn, amountOut);
        } else if(routerId == 1) {
            swapOnMooniswap(path, amountIn, amountOut);
        }

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
    
    function swapOnMooniswap(address[] memory path, uint amountIn, uint amountOut) private {
        
        if( 
            path[0] != ZERO &&
            ERC20(path[0]).allowance(address(this), UniswapV2Router02) < amountIn
        ) {
            ERC20(path[0]).approve(Mooniswap, MAXINT);
        }
        
        if(path[0] == ZERO) {
            IMooniswap(Mooniswap).swap{value: amountIn}(
                path[0],
                path[path.length-1],
                amountIn,
                amountOut,
                address(this)
            );
        } else {
            IMooniswap(Mooniswap).swap(
                path[0],
                path[path.length-1],
                amountIn,
                amountOut,
                address(this)
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
