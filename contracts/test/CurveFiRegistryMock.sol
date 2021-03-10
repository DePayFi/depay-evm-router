// SPDX-License-Identifier: MIT

pragma solidity >=0.7.5 <0.8.0;
pragma abicoder v2;

interface CurveFiPoolMock {
    function get_index(address input) external view returns (int128);
}

contract CurveFiRegistryMock {
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
        return (CurveFiPoolMock(_pool).get_index(_from), CurveFiPoolMock(_pool).get_index(_to), false);
    }
}
