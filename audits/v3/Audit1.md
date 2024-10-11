# Audit report

| Name       | Information                                 |  
| :--------: | --------------------                        |  
| Repository | https://github.com/DePayFi/depay-evm-router |  
| Checked    | `DePayRouterV3.sol`                         |  
| Branch     | v3                                          |  
| Time       | 2024-09-17                                  |  
| Author     | Nolan Graves                                |  

# Result

| Severity        | Count | Link                                                                                             |  
| :-------------: | ----: | ------------------------------------------------------------------------------------------------ |  
| High            | 0     |                                                                                                  |  
| Medium          | 1     |                                                                                                  |  
|                 |       | [M01 - Inconsistent handling of payment deadlines (milliseconds vs seconds)](#m01)               |  
| Low             | 1     |                                                                                                  |  
|                 |       | [L01 - Allowing ERC20 payments to `address(0)`, possibly burning tokens unintentionally](#l01)   |  
| Informational   | 1     |                                                                                                  |  
|                 |       | [I01 - Potential for funds to be stuck in contract, consider refunding excess Ether](#i02)       |  

---

<a name="m01"></a>

## M01 - Inconsistent handling of payment deadlines (milliseconds vs seconds)

| Affected            | Severity | Count | Lines                                                              |  
| :---------------:   | :------: | ----: | ------------------------------------------------------------------ |  
| `DePayRouterV3.sol` | Low      | 1     | Line in `_validatePreConditions` where deadline is compared        |  

**Description**

In the `_validatePreConditions` function, the contract checks if `payment.deadline < block.timestamp * 1000`. Since `block.timestamp` returns the current block timestamp in seconds, multiplying it by 1000 converts it to milliseconds. This means `payment.deadline` is expected to be in milliseconds, which may cause confusion and inconsistencies, as most Solidity time-related functions and variables use seconds.

**Recommendation**

Standardize the time units used in the contract to seconds. If milliseconds are necessary, clearly document this requirement in the contract and ensure that all time comparisons and inputs are consistently handled in milliseconds to avoid confusion and potential errors.

---

<a name="l01"></a>

## L01 - Allowing ERC20 payments to `address(0)`, possibly burning tokens unintentionally

| Affected            | Severity | Count | Lines                                                       |  
| :---------------:   | :------: | ----: | ----------------------------------------------------------- |  
| `DePayRouterV3.sol` | Low      | 1     | Line in `_payReceiver` where ERC20 tokens are transferred   |  

**Description**

In the `_payReceiver` function, when `payment.receiverType == 0` and `payment.tokenOutAddress` is an ERC20 token, the contract transfers `payment.paymentAmount` to `payment.paymentReceiverAddress` without checking if the address is `address(0)`. If `payment.paymentReceiverAddress` is `address(0)`, the tokens will be sent to the zero address, effectively burning them, which may not be the intended behavior.

**Recommendation**

Add a check to ensure that `payment.paymentReceiverAddress` is not `address(0)` before transferring ERC20 tokens. If the address is zero, revert the transaction with an appropriate error message.

---

<a name="i01"></a>

## I01 - Potential for funds to be stuck in contract, consider refunding excess Ether

| Affected            | Severity      | Count | Lines                                      |  
| :---------------:   | :-----------: | ----: | ------------------------------------------ |  
| `DePayRouterV3.sol` | Informational | 1     | Functions handling Ether (e.g., `receive`) |  

**Description**

If users accidentally send Ether to the contract without proper interaction (e.g., directly sending Ether to the contract's address), or if there are rounding errors and leftover Ether after operations, these funds may remain stuck in the contract. While the owner can withdraw tokens via the `withdraw` function, regular users cannot retrieve their mistakenly sent funds.

**Recommendation**

Implement a fallback mechanism or a function that allows users to retrieve their mistakenly sent Ether, provided they can prove ownership. Alternatively, provide clear instructions and warnings to users to prevent accidental transfers of Ether to the contract.

---

# Conclusion

The `DePayRouterV3` contract is designed to handle payments and token conversions securely. 
The initial high-severity concern regarding reentrancy was reassessed and found to be of low risk due to the absence of mutable state that could be exploited and the presence of balance checks that prevent state inconsistencies.

The remaining issues are of medium to low severity and should be addressed to enhance the contract's security and reliability.
Implementing the recommended changes will protect users' funds and improve the overall robustness of the contract.

