// SPDX-License-Identifier: MIT

// used for running automated hardhat tests

import '../libraries/Helper.sol';
import "hardhat/console.sol";
pragma solidity >=0.8.6 <0.9.0;

contract TestUnlock  {

  event UnlockEvent(
    address recipient
  );

  function purchase(
    uint256[] memory _values,
    address[] memory _recipients,
    address[] memory _referrers,
    address[] memory _keyManagers,
    bytes[] memory _data
  ) external payable returns (uint) {
    console.log("CALL");
    console.log(_values.length);
    console.log(_recipients.length);
    console.log(_referrers.length);
    console.log(_keyManagers.length);
    console.log(_data.length);

    emit UnlockEvent(_recipients[0]);
    return(_values[0]);
  }
}
