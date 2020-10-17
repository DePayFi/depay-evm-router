// SPDX-License-Identifier: GPL-3.0-only

pragma solidity >= 0.6.0;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v3.2.0/contracts/token/ERC20/ERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v3.2.0/contracts/utils/ReentrancyGuard.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v3.2.0/contracts/access/Ownable.sol";

interface IDePayV1ProcessorBeta {
    
    event ApproveAllDebug(
        address[] path
    );
    
    event SwapDebug(
        address[] path,
        uint amountIn,
        uint amountOut
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
        uint routerId,
        address payable receiver,
        uint id
    ) external payable;
  
}

interface IDePayV1RouterBeta {
  
    function swap(
        address[] calldata path,
        uint amountIn,
        uint amountOut
    ) external;
    
    function contractAddress() external view returns(address);
    
    function requiresApproval(address[] calldata path) external view returns(address[] memory);
  
}

contract DePayV1ProcessorBeta is IDePayV1ProcessorBeta, Ownable, ReentrancyGuard {
    
    address[] public routers;
    address private ZERO = 0x0000000000000000000000000000000000000000;
    uint private MAXINT = 115792089237316195423570985008687907853269984665640564039457584007913129639935;
    
     function allRouters() external view returns(address[] memory) {
        return routers;
    }
    
    function pay(
        address[] calldata path,
        uint amountIn,
        uint amountOut,
        uint routerId,
        address payable receiver,
        uint id
    ) external payable override nonReentrant {
        if(path[0] == ZERO) { require(msg.value >= amountIn, 'DePay: Insufficient amount payed in.'); }
        
        if(path.length <= 1) {
            _pay(receiver, msg.sender, path[0], amountOut);
        } else {
            transferIn(path[0], amountIn);
            //swap(routerId, path, amountIn, amountOut);
            _pay(receiver, address(this), path[path.length-1], amountOut);
        }
        
        emit Payment(id, msg.sender, receiver);
    }
    
    function transferIn(address token, uint amount) private {
        if(token != ZERO) {
            ERC20(token).transferFrom(msg.sender, address(this), amount);
        }
    }
    
    function swap(uint routerId, address[] memory path, uint amountIn, uint amountOut) private {
        uint balanceBefore = balance(path[path.length-1]);
        
        approveAll(path, IDePayV1RouterBeta(routers[routerId]).contractAddress());
        
        // routers[routerId].delegatecall(abi.encodeWithSignature("swap(address[],uint256, uint256)", path, amountIn, amountOut));

        uint balanceAfter = balance(path[path.length-1]);
        // require(balanceAfter > (balanceBefore + amountOut), 'DePay: Insufficient balance after swap.');
    }
    
    function approveAll(address[] memory tokens, address contractAddress) private {
        for (uint i; i < tokens.length - 1; i++) {
            ERC20(tokens[i]).approve(contractAddress, MAXINT);
        }
    }
    
    function balance(address token) private view returns(uint) {
        if(token == ZERO) {
            return address(this).balance;
        } else {
            ERC20(token).balanceOf(address(this));
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
    
    function addRouter(address routerAddress) external onlyOwner {
        routers.push(routerAddress);
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
