// SPDX-License-Identifier: MIT

pragma solidity >=0.7.5 <0.8.0;
pragma abicoder v2;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract CurveFiPoolMock {
    event TokenExchange(
        address indexed buyer,
        int128 sold_id,
        uint256 tokens_sold,
        int128 bought_id,
        uint256 tokens_bought
    );

    mapping(int128 => address) coins;
    mapping(address => int128) reversed_coins;

    function get_index(address input) public view returns (int128) {
        return reversed_coins[input];
    }

    function set_coin(int128 index, address coin_address) public returns (bool) {
        coins[index] = coin_address;
        reversed_coins[coin_address] = index;
        return true;
    }

    function exchange(
        int128 i,
        int128 j,
        uint256 dx,
        uint256 min_dy
    ) external returns (uint256) {
        uint256 dy = min_dy;
        require(ERC20(coins[i]).transferFrom(msg.sender, address(this), dx));
        require(ERC20(coins[j]).transfer(msg.sender, dy));
        emit TokenExchange(msg.sender, i, dx, j, dy);
        return dy;
    }
}
