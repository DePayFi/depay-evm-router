# Audit report

| Name       | Information |
|:----------:|-----------|
| Repository | https://github.com/DePayFi/depay-evm-router |
| Checked    | [DePayRouterV2.sol](https://github.com/DePayFi/depay-evm-router/blob/master/contracts/DePayRouterV2.sol) & [DePayForwarderV2.sol](https://github.com/DePayFi/depay-evm-router/blob/master/contracts/DePayForwarderV2.sol) |
| Branch     | [master](https://github.com/DePayFi/depay-evm-router) |
| Time       | Mon, 14 Aug 2021 03:59:35 UTC |
| Author     | Nikolai Petrov| 

# Result

| Severity | Count     | Link |
|:--------:|----------:|------|
| High     | 0        |       |
|Medium    | 0        |       | 
| Low      | 2         |       |
|||[L01 - No Check for 0 Addresses](#L01)|
|||[L02 - Possible Gas Limit Issues](#L02)|

<a name="L01"/>

## L01 - No Check for 0 Addresses

 Affected      | Severity  | Count | Lines |
|:-------------:|:----------|------:|-------:|
| DePayRouterV2.sol  | Low    |   1   | [27-30](https://github.com/DePayFi/depay-evm-router/blob/master/contracts/DePayRouterV2.sol#L27-L30)

There are no checks for zero addresses in the constructor when setting the PERMIT2 and FORWARDER addresses. This could result in accidental misconfiguration during deployment.

<a name="L02"/>

## L02 - Possible Gas Limit Issues

 Affected      | Severity  | Count | Lines |
|:-------------:|:----------|------:|-------:|
| DePayForwarderV2.sol  | Low    |   3   | [35-44](https://github.com/DePayFi/depay-evm-router/blob/master/contracts/DePayForwarderV2.sol#L35-L44)

The forward function has a lot going on, particularly with external calls using .call(). Depending on the behavior of the recipient contracts, this function can easily run out of gas. The contract doesn't seem to account for this, and it may fail silently.
