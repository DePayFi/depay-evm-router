// SPDX-License-Identifier: MIT

// used for running automated hardhat tests

import '../libraries/Helper.sol';
import "hardhat/console.sol";
pragma solidity >=0.8.6 <0.9.0;

contract TestStakingPool  {

  event StakeAddressAmountBooleanNative(
    address _for,
    uint256 amount,
    bool lock
  );

  function stakeAddressAmountBooleanNative(
    address _for,
    uint256 amount,
    bool lock
  ) public payable returns(bool) {
    emit StakeAddressAmountBooleanNative(
      _for,
      amount,
      lock
    );

    return(true);
  }

  event StakeAddressAmountBooleanToken(
    address _for,
    uint256 amount,
    bool lock
  );

  function stakeAddressAmountBooleanDAI(
    address _for,
    uint256 amount,
    bool lock
  ) public returns(bool) {
    Helper.safeTransferFrom(
      address(0x6B175474E89094C44Da98b954EedeAC495271d0F), // DAI
      msg.sender,
      address(this),
      amount
    );

    emit StakeAddressAmountBooleanToken(
      _for,
      amount,
      lock
    );

    return(true);
  }

  function stakeAddressAmountBooleanBUSD(
    address _for,
    uint256 amount,
    bool lock
  ) public returns(bool) {
    Helper.safeTransferFrom(
      address(0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56), // BUSD
      msg.sender,
      address(this),
      amount
    );

    emit StakeAddressAmountBooleanToken(
      _for,
      amount,
      lock
    );

    return(true);
  }
}
