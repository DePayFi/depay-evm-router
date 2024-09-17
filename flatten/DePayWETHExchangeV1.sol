// Dependency file: contracts/interfaces/IWETH.sol

// SPDX-License-Identifier: MIT

// pragma solidity 0.8.26;

interface IWETH {

  function deposit() payable external;
  function transfer(address dst, uint wad) external returns (bool);
  function withdraw(uint wad) external;
}


// Root file: contracts/DePayWETHExchangeV1.sol


pragma solidity 0.8.26;

// import 'contracts/interfaces/IWETH.sol';

/// @title DePayWETHExchangeV1
/// @notice This contract limits access to WETH to the functions wrap & unwrap only.
contract DePayWETHExchangeV1 {

  /// @notice Address of WETH
  IWETH public immutable WETH;

  /// @dev Initializes the contract with WETH address.
  /// @param _WETH The address of the WETH contract.
  constructor (address _WETH) {
    WETH = IWETH(_WETH);
  }

  /// @notice Accepts NATIVE transfers, required for unwrapping.
  receive() external payable {}

  /// @notice Deposits native currency and wraps it into WETH.
  /// @dev Wraps sent value into WETH and transfers it back to the sender.
  /// @return success Status of the deposit operation.
  function deposit() external payable returns(bool){
    WETH.deposit{value: msg.value}();
    (bool success) = WETH.transfer(msg.sender, msg.value);
    return success;
  }

  /// @notice Withdraws specified amount of WETH and unwraps it into native currency.
  /// @dev Unwraps WETH into native currency and sends it back to the sender.
  /// @param wad Amount of WETH to withdraw.
  /// @return success Status of the withdrawal operation.
  function withdraw(
    uint wad
  ) external returns(bool){
    WETH.withdraw(wad);
    (bool success,) = msg.sender.call{value: wad}(new bytes(0));
    return success;
  }
}
