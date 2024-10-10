# Audit report

| Name       | Information                                 |  
| :--------: | --------------------                        |  
| Repository | https://github.com/DePayFi/depay-evm-router |  
| Checked    | `DePayRouterV3.sol`                         |  
| Branch     | v3                                          |  
| Time       | 2024-09-30                                  |  
| Author     | Nikolai Mikhailov                           |  

# Result

| Severity        | Count | Link                                                                                             |  
| :-------------: | ----: | ------------------------------------------------------------------------------------------------ |  
| High            | 0     |                                                                                                  |  
| Medium          | 1     |                                                                                                  |  
|                 |       | [M01 - ProtocolAmount is not enforced, allowing users to bypass protocol fees](#m01)             |  
| Low             | 0     |                                                                                                  |  
|                 |       |                                                                                                  |  
| Informational   | 1     |                                                                                                  |  
|                 |       | [I01 - Inconsistent time units used for deadlines (milliseconds vs seconds)](#i02)               |  

---

<a name="m01"></a>

## M01 - ProtocolAmount is not enforced, allowing users to bypass protocol fees

| Affected            | Severity | Count | Lines                                                              |  
| :---------------:   | :------: | ----: | ------------------------------------------------------------------ |  
| `DePayRouterV3.sol` | Low      | 1     | Functions handling protocolAmount in payment processing            |  

**Description**

The contract intends to collect a protocol fee specified by `protocolAmount` within the Payment struct. However, this amount is provided by the user and not calculated or enforced by the contract. Users can set `protocolAmount` to zero or any arbitrary value, effectively bypassing the protocol fee mechanism.

**Impact**

The lack of enforcement allows users to avoid paying protocol fees, leading to potential revenue loss for the protocol and undermining the intended fee structure.

**Recommendation**

- Calculate Protocol Fee Internally: Remove protocolAmount from the user-supplied Payment struct. Instead, calculate it within the contract based on a predefined fee percentage of the transaction amount (e.g., paymentAmount or amountIn).

- Enforce Protocol Fee: Ensure that the calculated protocolAmount is correctly retained within the contract after the transaction and is not transferred to the payment receiver or any other party.

---

<a name="i01"></a>

## I01 - Inconsistent time units used for deadlines (milliseconds vs seconds)

| Affected            | Severity      | Count | Lines                                                     |  
| :---------------:   | :-----------: | ----: | ------------------------------------------                |  
| `DePayRouterV3.sol` | Informational | 1     | Line in _validatePreConditions comparing payment.deadline |  

**Description**

The contract checks whether the payment deadline has passed using `if (payment.deadline < block.timestamp * 1000)`, implying that `payment.deadline` is expected to be in milliseconds. In Solidity, `block.timestamp` is in seconds, and time-related calculations typically use seconds as the standard unit.

**Impact**

Using milliseconds can lead to confusion among developers and users who are accustomed to seconds. This inconsistency increases the risk of errors in setting or interpreting deadlines, potentially causing valid payments to be rejected or expired payments to be accepted.

**Recommendation**

- Standardize Time Units to Seconds: Modify the contract to use seconds for all time-related variables and comparisons. Change the deadline check to:

- Update External Interfaces: Ensure that any external systems or interfaces interacting with the contract are updated to use seconds for the payment.deadline parameter.

- Documentation: Clearly document the expected time units for payment.deadline to avoid confusion.

---

# Conclusion

The DePayRouterV3 contract is generally well-implemented, following best practices for secure token handling, access control, and integration with external protocols like Permit2. However, the protocol fee mechanism via protocolAmount is not properly enforced, allowing users to bypass protocol fees by specifying zero or minimal amounts. Addressing this issue is crucial to ensure the protocol collects intended fees.

Additionally, standardizing time units to seconds for deadlines will align the contract with Solidity conventions and reduce potential errors in payment processing.

