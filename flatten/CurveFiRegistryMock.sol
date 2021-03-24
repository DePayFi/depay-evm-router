// Root file: contracts/test/CurveFiRegistryMock.sol

// SPDX-License-Identifier: MIT

pragma solidity >=0.7.5 <0.8.0;
pragma abicoder v2;

contract CurveFiRegistryMock {
    mapping (address => int128) private coins;

    int128 private  total = 0;

    function addToken(address tokenAddress) external {
        coins[tokenAddress] = total;
        total += 1;
    }

    function get_coin_indices(
        address _pool,
        address _from,
        address _to
    )
        external
        view
        virtual
        returns (
            int128,
            int128,
            bool
        )
    {
        return (coins[_from], coins[_to], false);
    }
}
