# Audit report

| Name       | Information |
|:----------:|-----------|
| Repository | https://github.com/DePayFi/depay-ethereum-payments |
| Branch     | [master](https://github.com/DePayFi/depay-ethereum-payments) |
| Commit     | [f9b157c73e617bb6f5e5bdf6b68ef9599a044ce8](https://github.com/DePayFi/depay-ethereum-payments/tree/f9b157c73e617bb6f5e5bdf6b68ef9599a044ce8) |
| Time       | Sun, 31 Jan 2021 07:59:35 UTC |
| Author     | Chiro Hiro|

# Result

| Severity | Count     | Link |
|:--------:|----------:|------|
| High     | 2        |       |
|||[H01 - Possible ETH trap](#H01)|
|||[H02 - Possible access overlay data](#H02)|
|Medium    | 1        |       | 
|||[M01 - Gas cos optimization](#M01)|
| Low      | 2        |       |
|||[L01 - Unnecessary function](#L01)|
|||[L02 - Better to log received ETH](#L02)|

<a name="H01"/>

## H01 - Possible ETH trap

 Affected      | Severity  | Count | Lines |
|:-------------:|:----------|------:|-------:|
| DePayPaymentProcessorV1ApproveAndCallContractAddressAmount01.sol  | High    |   1   | [43-52](https://github.com/DePayFi/depay-ethereum-payments/blob/f9b157c73e617bb6f5e5bdf6b68ef9599a044ce8/contracts/DePayPaymentProcessorV1ApproveAndCallContractAddressAmount01.sol#L43-L52)

Let's check the code:

```solidity 
    if(path[path.length-1] == ZERO) {
      // Make sure to send the ETH along with the call in case of sending ETH.
      (success, returnData) = addresses[1].call{value: amounts[1]}(
        abi.encodeWithSignature(
          data[0],
          addresses[0],
          amounts[1]
        )
      );
    }
```

If this contract was triggered with empty `path` and `address`, we have:

- `path.length` is equal to `0` that meant `path[0-1]` is equal to `address(0)`

- `addresses[0]` is also equal to `address(0)`

Te given condition `path[path.length-1] == ZERO` will be satisfied to trigger `call()` opcode and send `amounts[1]` of Ethereum to `address(0x0)`.

**Suggest fix**: Please consider to check array length to make sure your fund is safe


<a name="H02"/>

## H02 - Possible access overlay data

 Affected      | Severity  | Count | Lines |
|:-------------:|:----------|------:|-------:|
| DePayPaymentProcessorV1.sol  | High    |   1   | [98-100](https://github.com/DePayFi/depay-ethereum-payments/blob/f9b157c73e617bb6f5e5bdf6b68ef9599a044ce8/contracts/DePayPaymentProcessorV1.sol#L98-L100)

Let's check an example:

```solidity 
contract A {
    uint256 a;
    
    event log(uint256 indexed val);
    
    function set() public{
        a++;
        emit log(a);
    }
}

contract B {
    uint256 a = 3;

    function set(address i) public {
       i.delegatecall(abi.encodeWithSelector(A(i).set.selector));
    }
}
```

When we call `B.set(A.deployed.address)` the log result is `4`. Contract `A` has `uint256 a` it take the same place in smart contract `B`. The same will thing happen in [DePayPaymentProcessorV1.sol#L98-L100](https://github.com/DePayFi/depay-ethereum-payments/blob/f9b157c73e617bb6f5e5bdf6b68ef9599a044ce8/contracts/DePayPaymentProcessorV1.sol#L98-L100). We need place holder to prevent target contract access overlay data that would be cause of uncertain result or unwanted overwrite.

E.g: It's possible to approve any plugin.

**Suggest**: You might need to define a `DePayPaymentsStorageV1` which will have place holder to prevent unwanted data access.

```solidity
contract DePayPaymentsStorageV1 is Ownable {
  
  using SafeMath for uint;
  using SafeERC20 for IERC20;

  // Address ZERO indicates ETH transfers.
  address public immutable ZERO = address(0);

  // List of approved plugins. Use approvePlugin to add new plugins.
  mapping (address => address) public approvedPlugins;

}
```

Related contracts need to derive from `DePayPaymentsStorageV1`:

```solidity
contract DePayPaymentsV1 is DePayPaymentsStorageV1 {

}

contract TargetContractOfDelegateCall is DePayPaymentsStorageV1 {

}
```

`TargetContractOfDelegateCall` will have placeholder to prevent itself access 


<a name="M01"/>

## M01 - Gas cos optimization

| Affected        | Severity  | Count | Lines |
|:----------------|:----------|------:|-------:|
| DePayPaymentProcessorV1ApproveAndCallContractAddressAmount01.sol   | Medium    |   1 |[12](https://github.com/DePayFi/depay-ethereum-payments/blob/f9b157c73e617bb6f5e5bdf6b68ef9599a044ce8/contracts/DePayPaymentProcessorV1ApproveAndCallContractAddressAmount01.sol#L12)|
| DePayPaymentProcessorV1.sol | Medium    |   1   |[19](https://github.com/DePayFi/depay-ethereum-payments/blob/f9b157c73e617bb6f5e5bdf6b68ef9599a044ce8/contracts/DePayPaymentProcessorV1.sol#L19)|

Let check the example code:

```solidity
contract A {
    address immutable ZERO = address(0);
    
    function check(address t) public returns(bool){
        return t == ZERO;
    }
}

contract B {
    function check(address t) public returns(bool){
        return t == address(0);
    }
}
```

Deploy `A` cost `40925 Gas`, deploy `B` cost `33487 Gas` since we need more gas to store `ZERO`.

It also increasing gas cost when we do compare, `A.check()` cost `275 Gas` and `B.check()` cost `260 Gas`.

It cost more than `15 Gas` whenever you do compare.

**Suggest fix**: Remove `ZERO` const and change from `token == ZERO` to `token == address(0)`.


<a name="L01"/>

## L01 - Unnecessary function

| Affected        | Severity  | Count | Lines |
|:----------------|:----------|------:|-------:|
| DePayPaymentProcessorV1.sol   | Low    |   1  |[152-154](https://github.com/DePayFi/depay-ethereum-payments/blob/f9b157c73e617bb6f5e5bdf6b68ef9599a044ce8/contracts/DePayPaymentProcessorV1.sol#L152-L154)|

[DePayPaymentProcessorV1.sol#L152-L154](https://github.com/DePayFi/depay-ethereum-payments/blob/f9b157c73e617bb6f5e5bdf6b68ef9599a044ce8/contracts/DePayPaymentProcessorV1.sol#L152-L154)

This function would do nothing, It's simply increase cost of execution and increase stack depth.

```solidity
  function _payableOwner() view private returns(address payable) {
    return payable(owner());
  }
```

Instead of `TransferHelper.safeTransferETH(_payableOwner(), amount);` we could use `TransferHelper.safeTransferETH(payable(owner()), amount);`. It doesn't change the realizable of code.

<a name="L02"/>

## L02 - Better to log received ETH

| Affected        | Severity  | Count | Lines |
|:----------------|:----------|------:|-------:|
| DePayPaymentProcessorV1.sol   | Low    |   1  |[35-39](https://github.com/DePayFi/depay-ethereum-payments/blob/f9b157c73e617bb6f5e5bdf6b68ef9599a044ce8/contracts/DePayPaymentProcessorV1.sol#L35-L39)|

[DePayPaymentProcessorV1.sol#L35-L39](https://github.com/DePayFi/depay-ethereum-payments/blob/f9b157c73e617bb6f5e5bdf6b68ef9599a044ce8/contracts/DePayPaymentProcessorV1.sol#L35-L39)

Receiver should emit event to help crosscheck much more easier:

```solidity
  receive() external payable {
    // Accepts ETH payments which is require in order
    // to swap from and to ETH
    // especially unwrapping WETH as part of token swaps.
  }
```

**Suggest fix**: 

```solidity
  event Received(address indexed from, address indexed to, uint256 indexed value);
   
  receive() external payable {
    // Accepts ETH payments which is require in order
    // to swap from and to ETH
    // especially unwrapping WETH as part of token swaps.
    emit Received(msg.sender, address(this), msg.value);
  }
```

# Conclusion

- Source code have better design structure
- There are less vulnerabilities than recent audit
- Logic issue didn't check, would need more time to simulate corner cases