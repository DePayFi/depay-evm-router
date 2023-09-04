# Audit report

|    Name    | Information                                                                                                                                                                                                               |
| :--------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repository | https://https://github.com/DePayFi/depay-evm-router                                                                                                                                                                       |
|  Checked   | [DePayForwarderV2.sol](https://github.com/DePayFi/depay-evm-router/blob/master/contracts/DePayForwarderV2.sol) & [DePayRouterV2.sol](https://github.com/DePayFi/depay-evm-router/blob/master/contracts/DePayRouterV2.sol) |
|   Branch   | [master](https://github.com/DePayFi/depay-evm-router/tree/master)                                                                                                                                                         |
|    Time    | Mon, 29 2023 03:59:35 UTC                                                                                                                                                                                                 |
|   Author   | [Temitayo Daniel](https://github.com/Timidan)                                                                                                                                                                             |

# Result

|        Severity         | Count | Link                                                                        |
| :---------------------: | ----: | --------------------------------------------------------------------------- |
|          High           |     1 |                                                                             |
|                         |       | [H01 - Native Token may get stuck in contract](#H01)                        |
|         Medium          |     1 |                                                                             |
|                         |       | [M01 - Excess eth not refunded](#M01)
|           Low           |     3 |                                                                             |
|                         |       | [L01 - Ownable contract has a single step ownership transferred](#L01)      |
|                         |       | [L02 - Pay function may revert without proper error message returned](#L02) |
|                         |       | [L03 - Missing zero address check](#L03)                                    |
|      Informational      |     4 |                                                                             |
|                         |       | [I01 - Using bools for storage incurs overhead.](#I01)                      |
|                         |       | [I02 - Long revert strings.](#I02)                                          |
|                         |       | [I03 - No Proper Natspec Comments](#I05)                                    |
|                         |       | [I04 - Issue: Floating Solidity Version](#I06)                              |
| Protocol Flow Questions |     3 |                                                                             |
|                         |       | [Q1 - Is it possible to withdraw funds from wallets...?](#Q1)               |
|                         |       | [Q2 - Can funds be withdrawn from the wallet...?](#Q2)                      |
|                         |       | [Q3 - Can funds that are remaining in the router be extracted...?](#Q3)     |

<a name="H01"/>

## H01 - Native Token may get stuck in contract

| Affected                                                                                                                                         | Severity | Count |                                                                                                                              Lines |
| :----------------------------------------------------------------------------------------------------------------------------------------------- | :------- | ----: | ---------------------------------------------------------------------------------------------------------------------------------: |
| [DePayForwarderV2.sol](https://github.com/DePayFi/depay-evm-router/blob/611385834fb6aa97fa5a2ebfcbeed3c46f03f51c/contracts/DePayForwarderV2.sol) | High     |     1 | [28](https://github.com/DePayFi/depay-evm-router/blob/611385834fb6aa97fa5a2ebfcbeed3c46f03f51c/contracts/DePayForwarderV2.sol#L28) |

Users who intend to use depayforwarder to send native tokens to the payment receiver, or want to pay the payment receiver the native tokens that have been converted through the router get stuck in the forwarder contract without forwarding to the payment receiver address. If a user passed in `1` as the `receiverType`, though it was stated in the documentation that receiver type 1 is not suitable for a native token payment, but there is no guard to prevent users from using type `1` to send Native tokens to the payment receiver.

[POC- test `forward` with `exchangeType`==0, receiverType ==1 i.e native token token swap & pull](./pocs//H01-1.png)

[Stack Trace - eth stuck in forwarder contract ](./pocs//H01-2.png)

[POC - An attacker siphoning the stuck eth through a 0 `amountIn` call ](./pocs//H01-3.png)

[Stack Trace- An attacker siphoning the stuck eth through a 0 `amountIn` call ](./pocs//H01-4.png)

#### Recommendation

If users are not allowed to use type 1 to send Native tokens out to the payment receiver, a proper check should be done to avoid users with inconsistent input to get their fund stuck in the contract. We strongly recommend that a sufficient check is implemented in the the function and also validates users' input before tokens are been transferred from users wallet.

Note that this also applies to the external call in [DepayRouterV2](https://github.com/DePayFi/depay-evm-router/blob/611385834fb6aa97fa5a2ebfcbeed3c46f03f51c/contracts/DePayRouterV2.sol#L190)

<a name="M01"/>

## M01 - Excess eth not refunded

| Affected                                                                                                                                   | Severity | Count |                                                                                                                             Lines |
| :----------------------------------------------------------------------------------------------------------------------------------------- | :------- | ----: | --------------------------------------------------------------------------------------------------------------------------------: |
| [DePayRouterV2.sol](https://github.com/DePayFi/depay-evm-router/blob/611385834fb6aa97fa5a2ebfcbeed3c46f03f51c/contracts/DePayRouterV2.sol) | Medium   |     1 | [129](https://github.com/DePayFi/depay-evm-router/blob/611385834fb6aa97fa5a2ebfcbeed3c46f03f51c/contracts/DePayRouterV2.sol#L129) |

The `_payIn` function in the router requires the sender to provide eth(msg.value) for the payment. If the user has provided more eth than the payment.amountIn value then this excess eth is not refunded back to the user.

[POC- test `pay` with amountIn == 5 ether, msg.value == 7 ether ](./pocs//M01-1.png)

[Stack Trace - 7 ether transferred](./pocs//M01-2.png)

[Logs - 5 ether transferred to receiver, 2 ether remaining, no refunds ](./pocs//M01-3.png)

#### Recommendation

At the end of Pay function,Add a refund logic to return the remaining ethAvailable back to the user. This can be done by substracting the `amountout` from `msg.value` and sending the remaining back to the user.

<a name="L01"/>

## L01 - Ownable contract has a single step ownership transferred

|                                                    Affected                                                    | Severity | Count |                     Lines |
| :------------------------------------------------------------------------------------------------------------: | :------- | ----: | ------------------------: |
| [DepayForwarderV2.sol](https://github.com/DePayFi/depay-evm-router/blob/master/contracts/DePayForwarderV2.sol) | Low      |     1 | `all onlyOwner modifiers` |
|    [DePayRouterV2.sol](https://github.com/DePayFi/depay-evm-router/blob/master/contracts/DePayRouterV2.sol)    | Low      |     1 | `all onlyOwner modifiers` |

The transferOwnership function transfers contract ownership in a single step. If the owner of a contract were set to an address not controlled by the DePay Team, the contract would be impossible to recover.

#### Recommendation

It is recommended to use a two-step process in which an owner proposes an ownership transfer and the proposed new owner accepts it, you can check the openzeppelin two step verification library [here](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/9e3f4d60c581010c4a3979480e07cc7752f124cc/contracts/access/Ownable2Step.sol#L19).

<a name="L02"/>

## L02 - Pay function may revert without proper error message returned.

Affected | Severity | Count | Lines |

| Affected                                                                                                                                   | Severity | Count |                                                                                                                           Lines |
| :----------------------------------------------------------------------------------------------------------------------------------------- | :------- | ----: | ------------------------------------------------------------------------------------------------------------------------------: |
| [DePayRouterV2.sol](https://github.com/DePayFi/depay-evm-router/blob/611385834fb6aa97fa5a2ebfcbeed3c46f03f51c/contracts/DePayRouterV2.sol) | Low      |     1 | [83](https://github.com/DePayFi/depay-evm-router/blob/611385834fb6aa97fa5a2ebfcbeed3c46f03f51c/contracts/DePayRouterV2.sol#L83) |

Users who planned to pay Native token and pay out Native token can pass in an exchange that has been enabled without passing a calldata, this will allow users to trigger the fallback function of the exchange because the payIn ether will get sent to the exchange and in return the Router will have no token to forward to the Forwarder contract which can lead to an `evm revert Error: OutOfFund`.

[POC](./pocs//L02.png)

#### Recommendation

It is advisable to check that users input are provided correctly for proper validation and return the proper error where necessary.

<a name="L03"/>

## L03 - Missing zero address check.

| Affected                                                                                                                                   | Severity | Count |                                                                                                                                                                                                                                                               Lines |
| :----------------------------------------------------------------------------------------------------------------------------------------- | :------- | ----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
| [DePayRouterV2.sol](https://github.com/DePayFi/depay-evm-router/blob/611385834fb6aa97fa5a2ebfcbeed3c46f03f51c/contracts/DePayRouterV2.sol) | Low      |     2 | [202](https://github.com/DePayFi/depay-evm-router/blob/611385834fb6aa97fa5a2ebfcbeed3c46f03f51c/contracts/DePayRouterV2.sol#L202),[206](https://github.com/DePayFi/depay-evm-router/blob/611385834fb6aa97fa5a2ebfcbeed3c46f03f51c/contracts/DePayRouterV2.sol#L206) |

Zero address checks are in general a best practice. However the `paymentReceiver` address is missing the address zero check and this can result to loss of funds if `tokenOut` is specified as `Native` in the `pay` function.

For ERC20 assets, `token.transfer()` generally implements this check but the payment of Native tokens do not have this check.

[POC](./pocs//L03-1.png)

[Stack trace](./pocs//L03-2.png)

[Balance sanity check](./pocs//L03-3.png)

#### Recommendation

Add zero address checks against the `paymentReceiver` address

<a name="I01"/>

## I01 - Using bools for storage incurs overhead.

| Affected                                                                                                                                         | Severity      | Count |                                                                                                                              Lines |
| :----------------------------------------------------------------------------------------------------------------------------------------------- | :------------ | ----: | ---------------------------------------------------------------------------------------------------------------------------------: |
| [DePayForwarderV2.sol](https://github.com/DePayFi/depay-evm-router/blob/611385834fb6aa97fa5a2ebfcbeed3c46f03f51c/contracts/DePayForwarderV2.sol) | Informational |     1 | [17](https://github.com/DePayFi/depay-evm-router/blob/611385834fb6aa97fa5a2ebfcbeed3c46f03f51c/contracts/DePayForwarderV2.sol#L17) |

Booleans are more expensive than uint256 or any type that takes up a full word because each write operation emits an extra SLOAD to first read the slot's contents which is very expensive, replace the bits taken up by the boolean, and then write back.

#### Recommendation

Use `uint256(1)` and `uint256(2)` for true/false to avoid a `Gwarmaccess` (100 gas) for extra `SLOAD`, and to avoid `Gsset` (20000 gas) when changing from `false` to `true`, after having been ‘true’ in the past. this means a value of 1 means false and 2 means true. more info [here](./pocs/gasOperations.png).

<a name="I02"/>

## I02 - Long revert strings.

| Affected                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Severity      | Count |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  Lines |
| :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------ | ----: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
| [DePayForwarderV2.sol](https://github.com/DePayFi/depay-evm-router/blob/611385834fb6aa97fa5a2ebfcbeed3c46f03f51c/contracts/DePayForwarderV2.sol)                                                                                                                                                                                                                                                                                                                                                                                        | Informational |     2 |                                                                                                                                                                                                                                                                  [19](https://github.com/DePayFi/depay-evm-router/blob/611385834fb6aa97fa5a2ebfcbeed3c46f03f51c/contracts/DePayForwarderV2.sol#L19),[47](https://github.com/DePayFi/depay-evm-router/blob/611385834fb6aa97fa5a2ebfcbeed3c46f03f51c/contracts/DePayForwarderV2.sol#L47) |
| [DePayRouterV2.sol](https://github.com/DePayFi/depay-evm-router/blob/611385834fb6aa97fa5a2ebfcbeed3c46f03f51c/contracts/DePayRouterV2.sol)                                                                                                                                                                                                                                                                                                                                                                                              | Informational |     8 | [93](https://github.com/DePayFi/depay-evm-router/blob/611385834fb6aa97fa5a2ebfcbeed3c46f03f51c/contracts/DePayRouterV2.sol#L93),[129](https://github.com/DePayFi/depay-evm-router/blob/611385834fb6aa97fa5a2ebfcbeed3c46f03f51c/contracts/DePayRouterV2.sol#L129),[155](https://github.com/DePayFi/depay-evm-router/blob/611385834fb6aa97fa5a2ebfcbeed3c46f03f51c/contracts/DePayRouterV2.sol#L155),[162](https://github.com/DePayFi/depay-evm-router/blob/611385834fb6aa97fa5a2ebfcbeed3c46f03f51c/contracts/DePayRouterV2.sol#L162), |
| [164](https://github.com/DePayFi/depay-evm-router/blob/611385834fb6aa97fa5a2ebfcbeed3c46f03f51c/contracts/DePayRouterV2.sol#L164),[169](https://github.com/DePayFi/depay-evm-router/blob/611385834fb6aa97fa5a2ebfcbeed3c46f03f51c/contracts/DePayRouterV2.sol#L169),[203](https://github.com/DePayFi/depay-evm-router/blob/611385834fb6aa97fa5a2ebfcbeed3c46f03f51c/contracts/DePayRouterV2.sol#L203),[214](https://github.com/DePayFi/depay-evm-router/blob/611385834fb6aa97fa5a2ebfcbeed3c46f03f51c/contracts/DePayRouterV2.sol#L214) |

Strings in solidity are handled in 32 byte chunks. A require string longer than 32 bytes uses more gas.

#### Recommendation

Use custom errors or shorten the revert messages

<a name="I03"/>

## I03 - No Proper Natspec Comments

| Affected                                                                                                                                         | Severity      | Count | Lines |
| :----------------------------------------------------------------------------------------------------------------------------------------------- | :------------ | ----: | ----: |
| [DePayForwarderV2.sol](https://github.com/DePayFi/depay-evm-router/blob/611385834fb6aa97fa5a2ebfcbeed3c46f03f51c/contracts/DePayForwarderV2.sol) | Informational |     - |     - |
| [DePayRouterV2.sol](https://github.com/DePayFi/depay-evm-router/blob/611385834fb6aa97fa5a2ebfcbeed3c46f03f51c/contracts/DePayRouterV2.sol)       | Informational |     - |     - |

Natspec mode of comment is often recommended to be integrated in codebases because it explicitly captures most of the details that form a function. It is most appropriate because it explains the motive of a function and if the function takes parameters, it explains it. Even non-technical users engaging the codebase will get some glimpse of understanding on the kind of functions they are calling.

#### Recommendation

Use the natspec mode of comment for the external and public function

<a name="I04"/>

## I04 - Floating Solidity Version

| Affected                                                                                                                                         | Severity      | Count |                                                                                                                            Lines |
| :----------------------------------------------------------------------------------------------------------------------------------------------- | :------------ | ----: | -------------------------------------------------------------------------------------------------------------------------------: |
| [DePayForwarderV2.sol](https://github.com/DePayFi/depay-evm-router/blob/611385834fb6aa97fa5a2ebfcbeed3c46f03f51c/contracts/DePayForwarderV2.sol) | Informational |     1 | [3](https://github.com/DePayFi/depay-evm-router/blob/611385834fb6aa97fa5a2ebfcbeed3c46f03f51c/contracts/DePayForwarderV2.sol#L3) |
| [DePayRouterV2.sol](https://github.com/DePayFi/depay-evm-router/blob/611385834fb6aa97fa5a2ebfcbeed3c46f03f51c/contracts/DePayRouterV2.sol)       | Informational |     1 |  [169](https://github.com/DePayFi/depay-evm-router/blob/611385834fb6aa97fa5a2ebfcbeed3c46f03f51c/contracts/DePayRouterV2.sol#L3) |

In both contracts, there is an implementation of a floating solidity pragma version “>= 0.8.18 < 0.9.0”. The implication for the use of floating version is the tendency that the code base could be deployed with an unstable version with undiscovered bugs or compiler related issues and this could implicate users when this is discovered in the future.

#### Recommendation

We recommend the use of a stable version that has been well-tested and acknowledged to be free of bugs to prevent unforeseen and unintended future issues.

### Answers to Protocol Flow Questions

<a name="Q01"/>

#### Is it possible to withdraw funds from wallets that have given token approvals, either via direct allowance or via permit2, to the router without their consent/signature, by executing transactions from another wallet?

- The reason why an attacker cannot spend another account’s allowance made to the router, either by direct approval or via Permit2 is because the router contract expects the caller of the pay function to be the account that approved the contractor spend the tokens. It would have been possible to exploit this if the pay function input parameters included passing an address who has given the router the tokens. In the \_payIn function, direct approval (` IERC20(payment.tokenInAddress).safeTransferFrom(msg.sender, address(this), payment.amountIn``)) and the permit2 ( `IPermit2(PERMIT2).transferFrom(msg.sender, address(this), uint160(payment.amountIn), payment.tokenInAddress``), both use the msg.sender. This implies that the caller of the function must be the account that has made approval(direct ERC20 approval/permit2) to the router.

<a name="Q02"/>

#### Can funds be withdrawn from the wallet that is interacting with the router besides the ones he intends to use for the payment and that are passed via payment arguments?

- The answer is No , funds can not be withdrawn from a wallet that is interacting with the router because the user will approve the exact amount which they will need for that transaction . for any fund that will need to go out of any user wallet which was not intended, need to be approved by the user .

<a name="Q03"/>

#### Can funds that are remaining in the router be extracted by anyone but the admin? If no, explain why not.

- For funds remaining in the router contract, it is impossible for any address to withdraw these funds because the withdraw function has an onlyOwner modifier to moderate who can call the function. It is also pertinent to mention also that with the presence of the \_validatePreConditions and \_validatePostConditions hooks, they are specifically ensuring that users pay the amount they provided in the payment tuple. These hooks affirm the balance of the native or ERC20 tokens in the contract before a user pays into the router and also affirms that there are more in the contract after a successful interaction. If these conditions are not met, they will revert, making it impossible to steal from the contract via other functions since the withdraw function is secured with the onlyOwner modifier.

### Mitigation
All findings have been improved/mitigated as part of this: https://github.com/DePayFi/depay-evm-router/pull/61
