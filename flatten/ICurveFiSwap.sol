// Root file: contracts/interfaces/ICurveFiSwap.sol

// SPDX-License-Identifier: MIT

pragma solidity >=0.8.6 <0.9.0;

interface ICurveFiSwap {
    event TokenExchange(
        address indexed buyer,
        address indexed receiver,
        address indexed pool,
        address token_sold,
        address token_bought,
        uint256 amount_sold,
        uint256 amount_bought
    );

    function exchange_with_best_rate(
        address _from,
        address _to,
        uint256 _amount,
        uint256 _expected
    ) external payable returns (uint256);

    function exchange_with_best_rate(
        address _from,
        address _to,
        uint256 _amount,
        uint256 _expected,
        address _receiver
    ) external payable returns (uint256);

    function exchange(
        address _pool,
        address _from,
        address _to,
        uint256 _amount,
        uint256 _expected
    ) external payable returns (uint256);

    function exchange(
        address _pool,
        address _from,
        address _to,
        uint256 _amount,
        uint256 _expected,
        address _receiver
    ) external payable returns (uint256);

    function get_best_rate(
        address _from,
        address _to,
        uint256 _amount
    ) view external returns (address, uint256);

    function get_exchange_amount(
        address _pool,
        address _from,
        address _to,
        uint256 _amount
    ) view external returns (uint256);

    function get_input_amount(
        address _pool,
        address _from,
        address _to,
        uint256 _amount
    ) view external returns (uint256);

    function get_exchange_amounts(
        address _pool,
        address _from,
        address _to,
        uint256[100] calldata _amounts
    ) view external returns (uint256[100] memory);

    function get_calculator(address _pool) view external returns (address);

    function update_registry_address() external returns (bool);

    function set_calculator(address _pool, address _calculator) external returns (bool);

    function set_default_calculator(address _calculator) external returns (bool);

    function claim_balance(address _token) external returns (bool);

    function set_killed(bool _is_killed) external returns (bool);

    function registry() view external returns (address);

    function default_calculator() view external returns (address);

    function is_killed() view external returns (bool);
}
