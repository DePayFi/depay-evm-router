// SPDX-License-Identifier: MIT

pragma solidity >=0.7.5 <0.8.0;
pragma abicoder v2;

interface CurveFiRegistryMock {
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
        );
}
