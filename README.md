# DePay's EVM Router

Plugin based EVM smart contract enabling various payment-related peer-to-peer transactions like: One-off Payments, Subscriptions, Sales, Swaps, Payroll and Credit.

## Deployments

`DePayRouterV1`

Ethereum: [0xae60ac8e69414c2dc362d0e6a03af643d1d85b92](https://etherscan.io/address/0xae60ac8e69414c2dc362d0e6a03af643d1d85b92)

Binance Smart Chain: [0x78C0F1c712A9AA2004C1F401A7307d8bCB62abBd](https://bscscan.com/address/0x78c0f1c712a9aa2004c1f401a7307d8bcb62abbd)

## Summary

This set of smart contracts enables decentralized payments.

The main purpose of this set of smart contracts evolves around the `route` function,
which allows a sender to route crypto assets while converting tokens as part of the same transaction if required.

This allows for ETH to ETH, tokenA to tokenA, ETH to tokenA, tokenA to ETH and tokenA to tokenB conversions as part of e.g. payments.

To increase functionalities and to enable more and future decentralized exchanges and protocols,
additional plugins can be added/approved by calling `approvePlugin`.

## Functionalities

### `route` Route Transactions

The main function to route transactions.

Arguments:

`path`: The path of the token conversion:

```
ETH to ETH: 
['0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE']

DEPAY to DEPAY: 
['0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb']

ETH to DEPAY: 
['0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', '0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb']

DEPAY to ETH: 
['0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb', '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE']

DEPAY to UNI (routing goes through WETH): 
['0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb', '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984']
```

`amounts`: Amounts passed to proccessors:

```
e.g. [amountIn, amountOut, deadline]
```

`addresses`: Addresses passed to proccessors:

```
e.g. [receiver]
or [for, smartContractReceiver]
```

`plugins`: List of plugins to be executed in the given order for this payment:

```
e.g. [DePayRouterV1Uniswap01, DePayRouterV1Payment01] to swap and pay
or [DePayRouterV1Uniswap01, DePayRouterV1ApproveAndCallContractAddressAmount01] to swap and call another contract
```
See [Approved Plugins](#approved-plugins) for more details about available and approved plugins.

`data`: Additional data passed to the payment plugins (e.g. contract call signatures):

```
e.g. ["signatureOfSmartContractFunction(address,uint)"] receiving the payment
```

### `approvePlugin` Approves a plugin.

`plugin`: Address for the plugin to be approved.

## Plugins

### DePayRouterV1Payment01

Used to send a payment (ETH or any transferable token) to a receiver.

Sends the token of path at the last position (`path[path.length-1]`) for the amount at index 1 (`amounts[1]`) to the address at the last position (`addresses[addresses.length-1]`).

Can be used to perform token sales from decentralized exchanges to the sender by setting `addresses` to `[<sender address>]`.

Ethereum: [0x99F3F4685a7178F26EB4F4Ca8B75a1724F1577B9](https://etherscan.io/address/0x99f3f4685a7178f26eb4f4ca8b75a1724f1577b9)

Binance Smart Chain: [0xC9850b32475f4fdE5c972EA6f967982a3c435D10](https://bscscan.com/address/0xc9850b32475f4fde5c972ea6f967982a3c435d10#code)

### DePayRouterV1PaymentEvent01

Used to log a payment event on-chain if requested. If not required/requested, not using it does safe gas.

Emits a `Payment` event on the `DePayRouterV1PaymentEvent01` contract using `addresses[0]` as the `sender` of the event and `addresses[addresses.length-1]` as the `receiver` of the `Payment`.

Ethereum: [0xDDe66e253aCb96E03E8CAcEc0Afb9308f496c732](https://etherscan.io/address/0xdde66e253acb96e03e8cacec0afb9308f496c732)

### DePayRouterV1SaleEvent01

Used to log a sale event on-chain if requested. If not required/requested, not using it does safe gas.

Emits a `Sale` event on the `DePayRouterV1SaleEvent01` contract using `addresses[0]` as the `buyer`.

Ethereum: [0xA47D5E0e6684D3ad73F3b94d9DAf18a2f5F97688](https://etherscan.io/address/0xa47d5e0e6684d3ad73f3b94d9daf18a2f5f97688)

### DePayRouterV1Uniswap01

UniswapV2

Swap tokenA to tokenB, ETH to tokenA or tokenA to ETH on Uniswap as part of the payment.

Swaps tokens according to provided `path` using the amount at index 0 (`amounts[0]`) as input amount,
the amount at index 1 (`amounts[1]`) as output amount and the amount at index 2 (`amount[2]`) as deadline.

Ethereum: [0xe04b08Dfc6CaA0F4Ec523a3Ae283Ece7efE00019](https://etherscan.io/address/0xe04b08dfc6caa0f4ec523a3ae283ece7efe00019)

### DePayRouterV1PancakeSwap01

Swap tokenA to tokenB, ETH to tokenA or tokenA to ETH on Uniswap as part of the payment.

Swaps tokens according to provided `path` using the amount at index 0 (`amounts[0]`) as input amount,
the amount at index 1 (`amounts[1]`) as output amount and the amount at index 2 (`amount[2]`) as deadline.

Binance Smart Chain: [0xfAD2F276D464EAdB71435127BA2c2e9dDefb93a4](https://bscscan.com/address/0xfad2f276d464eadb71435127ba2c2e9ddefb93a4#code)

### DePayRouterV1UniswapV301

UniswapV3

Swap tokenA to tokenB, ETH to tokenA or tokenA to ETH on Uniswap as part of the payment.

Swaps tokens according to provided `path` using the amount at index 0 (`amounts[0]`) as input amount,
the amount at index 1 (`amounts[1]`) as expecting output amount.

We do packing in `amounts[2]` we use 256 bits to store `fee` (`fee` is used to `0xbb8`, `0x2710`) and `sqrtPriceLimitX96`

```
[sqrtPriceLimitX96: uint160] [reversed: 72 bits] [fee: uint24]
```

The amount at index 3 (`amount[3]`) as deadline.

You might need to call `getPool()` of [UniswapV3Factory](https://etherscan.io/address/0x1f98431c8ad98523631ae4a59f267346ea31f984) to check pool's existence.

Ethereum: [XXX](https://etherscan.io/address/?)

### DePayRouterV1CurveFiSwap01

This plugin allows you to use CurveFi to swap/exchange tokens.

This plugin will forward the call to: `CurveFiSwaps` contract, this contract will work with `CurveFiPools` and swap your tokens.
Each pool is only able to support some kind of tokens, you might need registry contracts to lookup these information.

These parameters are required in order to swap on CurveFi:
- `fromToken`: Token to be swapped
- `toToken`: Token to be received
- `pool`: CurFiPool address, we don't use onchain computation to lookup for best rate since the gas cost isn't efficient
- `amount`: Amount that's going to swap
- `expected`: Expected amount of `toToken` after the swap

Here is how we forge router params:
- `path`: `[fromToken, toToken]` fromToken and toToken address
- `amounts`: `[amount, expected]` if calculated receiving amount less than `expected` transaction will be reversed.
- `address`: `[pool]` pool address of the CurveFi pool needs to be calculated off-chain for better rate
- `data`: Optional

**note**: CurveFi only works with [sETH](https://etherscan.io/address/0x5e74C9036fb86BD7eCdcb084a0673EFc32eA31cb)

Ethereum: [0xcac512f9a8599d251117d18b72a91cd5b2219a95](https://etherscan.io/address/0xcac512f9a8599d251117d18b72a91cd5b2219a95)

### DePayRouterV1SushiSwap01

Swap tokenA to tokenB, ETH to tokenA or tokenA to ETH on SuhiSwap (based on Uniswap) as part of the payment.

Swaps tokens according to provided `path` using the amount at index 0 (`amounts[0]`) as input amount,
the amount at index 1 (`amounts[1]`) as output amount and the amount at index 2 (`amount[2]`) as deadline.

Ethereum: [0xd617fdc26d762ade48Ff54c2E1DE148BFB3F9D22](https://etherscan.io/address/0xd617fdc26d762ade48ff54c2e1de148bfb3f9d22)

### DePayRouterV1OneInchSwap01

Swap tokenA to tokenB, ETH to tokenA or tokenA to ETH on OneSplitSwap (1Inch Protocol).

Swaps tokens according to provided `path` using the amount at index 0 (`amounts[0]`) as input amount,
the amount at index 1 (`amounts[1]`) as output amount and the amount at index 2 (`amount[2]`) as flags of 1Inch Protocol.

The rest of remaining elements of `amounts[]` is distribution of 1Inch Protocol.

We need to call: `OneSplitSwap.getExpectedReturn()` to calculate `distribution` of pool and `outAmount`. `outAmount` doesn't the real amount you would be received then we need calculate `expectedAmount` by subtract from `outAmount` three percents to make sure our transaction won't get revert in term of market's adjustment.

Ethereum: [0x8c5d2F0e65275369025c7511c216564beCC8d530](https://etherscan.io/address/0x8c5d2f0e65275369025c7511c216564becc8d530#code)

### DePayRouterV1ApproveAndCallContractAddressAmount01

Call another smart contract to deposit an amount for a given address while making sure the amount passed to the contract is approved.

Approves the amount at index 1 of `amounts` (`amounts[1]`)
for the token at the last position of `path` (`path[path.length-1]`)
to be used by the smart contract at index 1 of `addresses` (`addresses[1]`).

Afterwards, calls the smart contract at index 1 of `addresses` (`addresses[1]`),
passing the address at index 0 of `addresses` (`addresses[0]`)
and passing the amount at index 1 of `amounts` (`amounts[1]`)
to the method with the signature provided in `data` at index 0 (`data[0]`).

Ethereum: [0x6F44fF404E57Ec15223d58057bd28519B927ddaB](https://etherscan.io/address/0x6f44ff404e57ec15223d58057bd28519b927ddab)

## Examples

### tokenA to tokenB payment, swapped via Uniswap, with smart contract receiver (e.g. staking pool)

Ethereum: [XXX](XXX)

`path` needs to go through tokenA -> WETH -> tokenB if executed by Uniswap.

Requires to approve token at first index of path to be approved for the payment protocol smart contract.

Get amounts through the Uniswap router by passing the same `path` and the desired output amount to receive the required input amount.

```
value: 0

path: ["0xAb4c122a024FeB8Eb3A87fBc7044ad69E51645cB","0xc778417E063141139Fce010982780140Aa0cD5Ab","0x9c2Db0108d7C8baE8bE8928d151e0322F75e8Eea"]

amounts: ["8551337980759167135310","1000000000000000000","1711537544"]

addresses: ["0x08B277154218CCF3380CAE48d630DA13462E3950","0x0d8A34Cb6c08Ec71eA8009DF725a779B1877d4c5"]

plugins: ["0xc1F6146f45b6EC65FA9E8c8E278bb01879b32268","0x60cc73eb2b2B983554C9f66B26115174eD2C6335"]

data: ["depositFor(address,uint256)"]
```

`Gas usage: approx. 304,000`

### tokenA to tokenB payment, swapped via Uniswap

Ethereum: https://etherscan.io/tx/0x02fcdb7908cfc8274dfc3fb096fac14ec22f8a459b7962921ba1b26b920cb9d3

`path` needs to go through tokenA -> WETH -> tokenB if executed by Uniswap.

Requires to approve token at first index of path to be approved for the payment protocol smart contract.

Get amounts through the Uniswap router by passing the same `path` and the desired output amount to receive the required input amount.

```
value: 0

path: ["0xAb4c122a024FeB8Eb3A87fBc7044ad69E51645cB","0xc778417e063141139fce010982780140aa0cd5ab","0x1f9840a85d5af5bf1d1762f925bdaddc4201f984"]

amounts: ["10187046138967433440396","10000000000000000","1711537544"]

addresses: ["0x08B277154218CCF3380CAE48d630DA13462E3950"]

plugins: ["0xc1F6146f45b6EC65FA9E8c8E278bb01879b32268","0x7C9cfd8905E8351303b0bE5D8378b3D453532c44"]

data: []
```

`Gas usage: approx. 253,000`

IMPORTANT: Don't forget to use the actual payment plugin at the end of `plugins`
to avoid depositing swaps into the payment contract itself (without performing a payment).

### tokenA to tokenB payment, swapped via CurveFi

Ethereum: https://etherscan.io/tx/0xdc63161f2ced3c54c73eb05a328759b66b623a9eaed45f293b567d7ca912008c

Make sure you've approved token at first index of the path to be approved for the payment protocol smart contract.

```
value: 0

path: ["0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48","0xdAC17F958D2ee523a2206206994597C13D831ec7"]

amounts: [10015000,10000000]

addresses: ["0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7","0x08B277154218CCF3380CAE48d630DA13462E3950"]

plugins: ["0xcaC512F9a8599D251117D18B72a91Cd5B2219A95","0x99F3F4685a7178F26EB4F4Ca8B75a1724F1577B9"]

data: []
```

`Gas usage: approx. 253,000`

IMPORTANT: Don't forget to use the actual payment plugin at the end of `plugins`
to avoid depositing swaps into the payment contract itself (without performing a payment).

### tokenA to ETH payment, swapped via Uniswap

Ethereum: https://etherscan.io/tx/0x4ae0acb287d3a4cc59edacb8206161cc5abf3c188db286e6a751387d7761e409

```
value: "0"

path: ["0xAb4c122a024FeB8Eb3A87fBc7044ad69E51645cB","0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"]

amounts: ["1735972857185674397500","10000000000000000","1711537544"]

addresses: ["0x08B277154218CCF3380CAE48d630DA13462E3950"]

plugins: ["0xc1F6146f45b6EC65FA9E8c8E278bb01879b32268","0x7C9cfd8905E8351303b0bE5D8378b3D453532c44"]

data: []
```

`Gas usage: approx. 213,000`

IMPORTANT: Don't forget to use the actual payment plugin at the end of `plugins`
to avoid depositing swaps into the payment contract itself (without performing a payment).

### ETH to tokenA payment, swapped via Uniswap

Ethereum: [XXX](XXX)

```
value: "5997801900122"

path: ["0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE","0xAb4c122a024FeB8Eb3A87fBc7044ad69E51645cB"]

amounts: ["5997801900122","1000000000000000000","1711537544"]

addresses: ["0x08B277154218CCF3380CAE48d630DA13462E3950"]

plugins: ["0xc1F6146f45b6EC65FA9E8c8E278bb01879b32268","0x7C9cfd8905E8351303b0bE5D8378b3D453532c44"]

data: []
```

`Gas usage: approx. 172,000`

IMPORTANT: Don't forget to use the actual payment plugin at the end of `plugins`
to avoid depositing swaps into the payment contract itself (without performing a payment).

### Sale (sell tokens from decentralized exchanges)

Ethereum: https://etherscan.io/tx/0xff01f0193410c696070034fd95fa1e662082bef16eade6832dff855d0910e891

```
value: "5998045319783"

path: ["0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE","0xAb4c122a024FeB8Eb3A87fBc7044ad69E51645cB"]

amounts: ["5998045319783","1000000000000000000","1711537544"]

addresses: ["0x317D875cA3B9f8d14f960486C0d1D1913be74e90"]

plugins: ["0xc1F6146f45b6EC65FA9E8c8E278bb01879b32268","0x7C9cfd8905E8351303b0bE5D8378b3D453532c44"]

data: []
```

`Gas usage: approx. 187,000`

IMPORTANT: Make sure to set the address of the purchaser (sender == receiver) and to use the actual payment plugin to send the swap back to the purchaser.

### Log sale event

Ethereum: [XXX](XXX)

```
value: "5998045319783"

path: ["0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE","0xAb4c122a024FeB8Eb3A87fBc7044ad69E51645cB"]

amounts: ["5998045319783","1000000000000000000","1711537544"]

addresses: ["0x317D875cA3B9f8d14f960486C0d1D1913be74e90"]

plugins: ["0xc1F6146f45b6EC65FA9E8c8E278bb01879b32268","0x7C9cfd8905E8351303b0bE5D8378b3D453532c44","0x78AC73A852BB11eD09Cb14CAe8c355A4C0fAC476"]

data: []
```

`Gas usage: approx. 187,000`

IMPORTANT: The sale log event will be emited on the sale event plugin itself and will be part of the transaction.

### tokenA to tokenA payment

Ethereum: https://etherscan.io/tx/0x9577d0153edcf5e314b990e248657ca18d6a75c5cae3187617144a3adf2c2ac6

_Consider performing tokenA to tokenA transfers directly if you don't rely on any other plugins or the payment event._

_Needs spending approval on path[0] token contract for the router (spender) first._

```
value: "0"

path: ["0xAb4c122a024FeB8Eb3A87fBc7044ad69E51645cB"]

amounts: ["10000000000000000","10000000000000000"]

addresses: ["0x08B277154218CCF3380CAE48d630DA13462E3950"]

plugins: ["0x7C9cfd8905E8351303b0bE5D8378b3D453532c44"]

data: []
```

`Gas usage: approx. 80,000`

IMPORTANT: Don't forget to use the actual payment plugin at the end of `plugins`
to avoid depositing into the payment contract itself without performing a payment.

### ETH to ETH payment

Ethereum: https://etherscan.io/tx/0xecf207f7b2b7ccfdf0e8e8a09d99b9154737ec86f9c60aabd20c715cbf324931

_Consider performing ETH to ETH transfers directly and not via the DePayRouter, if you don't rely on any other plugin, in order to save gas._

```
value: "10000000000000000"

path: ["0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"]

amounts: ["10000000000000000","10000000000000000"]

addresses: ["0x08B277154218CCF3380CAE48d630DA13462E3950"]

plugins: ["0x7C9cfd8905E8351303b0bE5D8378b3D453532c44"]

data: []
```

`Gas usage: approx. 48,400`

IMPORTANT: Don't forget to use the actual payment plugin at the end of `plugins`
to avoid just depositing into the payment contract itself without performing a payment.

### Log payment event

Ethereum: [XXX](XXX)

```
value: "10000000000000000"

path: ["0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"]

amounts: ["10000000000000000","10000000000000000"]

addresses: ["0x08B277154218CCF3380CAE48d630DA13462E3950"]

plugins: ["0x7C9cfd8905E8351303b0bE5D8378b3D453532c44","0x076f1f13efA6b194f636E265856D0381704fC394"]

data: []
```

`Gas usage: approx. 63,800`

IMPORTANT: The payment log event will be emited on the payment event plugin itself and will be part of the transaction.

## Security Audits

1. https://github.com/DePayFi/depay-evm-router/blob/master/docs/Audit1.md
2. https://github.com/DePayFi/depay-evm-router/blob/master/docs/Audit2.md
3. https://github.com/DePayFi/depay-evm-router/blob/master/docs/Audit3.md

## Development

### Quick Start

```
yarn install
yarn test
```

### Testing

```
yarn test
```

or to run single tests:
```
yarn test -g 'deploys router successfully'
```

### Deploy

1. `yarn flatten`

2. Deploy flatten contract via https://remix.ethereum.org/
