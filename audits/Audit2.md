# Audit report

| Name       | Information |
|:----------:|-----------|
| Repository | https://github.com/DePayFi/depay-ethereum-payments |
| Checked   | [DePayPaymentsV1ApproveAndCallContractAddressAmount01.sol](https://github.com/DePayFi/depay-ethereum-payments/blob/master/contracts/DePayPaymentsV1ApproveAndCallContractAddressAmount01.sol)|
| Branch     | [master](https://github.com/DePayFi/depay-ethereum-payment-processing) |
| Time       | Sat, 30 Jan 2021 07:59:35 UTC |
| Author     | Temitayo Daniel|

# Result

| Severity | Count     |
|:--------:|----------:|
| High     | 0        |    
|Medium    | 0        |    
| Low      | 0         | 


The revamped contracts at [DepayPaymentsV1](https://github.com/DePayFi/depay-ethereum-payments/blob/master/contracts/DePayPaymentsV1.sol) and [DePayPaymentsV1Uniswap01](https://github.com/DePayFi/depay-ethereum-payments/blob/master/contracts/DePayPaymentsV1Uniswap01.sol) in addition to the latest addition [DePayPaymentsV1ApproveAndCallContractAddressAmount01](https://github.com/DePayFi/depay-ethereum-payments/blob/master/contracts/DePayPaymentsV1ApproveAndCallContractAddressAmount01.sol) were thoroughly checked and were found to have contained no count of high,medium or low severity bugs.

They have also followed standard variable naming patterns and gas efficient calculations

All low severity bugs reported in [Audit1](https://github.com/Timidan/depay-ethereum-payment-processing/blob/master/Audit1.md) have been fixed [here](https://github.com/DePayFi/depay-ethereum-payments/pull/5/commits/5595b7d579fa4ecf241a1a8f8256dc3050b506e1) & [here](https://github.com/DePayFi/depay-ethereum-payments/pull/5/commits/9f955dcf84b18f0fefe7659b2680aedad7fa64b1) .

No further actions are required

