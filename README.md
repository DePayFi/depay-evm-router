# DePay's EVM Router

DePay's EVM Router. Plugin-based decentralized payment routing.

## Deployments

`DePayRouterV1`

Ethereum: [0xae60ac8e69414c2dc362d0e6a03af643d1d85b92](https://etherscan.io/address/0xae60ac8e69414c2dc362d0e6a03af643d1d85b92)

BNB Smart Chain: [0x0Dfb7137bC64b63F7a0de7Cb9CDa178702666220](https://bscscan.com/address/0x0dfb7137bc64b63f7a0de7cb9cda178702666220)

Polygon (Matic): [0x2CA727BC33915823e3D05fe043d310B8c5b2dC5b](https://polygonscan.com/address/0x2CA727BC33915823e3D05fe043d310B8c5b2dC5b)

## Summary

This set of smart contracts enables decentralized payments.

The main purpose of this set of smart contracts evolves around the `route` function,
which allows a sender to route crypto assets while converting tokens as part of the same transaction if required.

This allows for NATIVE to NATIVE, NATIVE to TOKEN, TOKEN to NATIVE and TOKEN_A to TOKEN_B payments.

To increase functionalities and to enable more and future decentralized exchanges and protocols,
additional plugins can be added/approved by calling `approvePlugin`.

## Functionalities

### `route` Route Transactions

The main function to route transactions.

Arguments:

`path`: The path of the token conversion:

```
NATIVE Payment: 
['0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE']

TOKEN Payment: 
['0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb']

NATIVE to TOKEN Payment: 
['0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', '0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb']

TOKEN to NATIVE Payment:
['0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb', '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE']

TOKEN_A to TOKEN_B Payment: 
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
See [Plugins](#plugins) for more details about available plugins.

`data`: Additional data passed to the payment plugins (e.g. contract call signatures):

```
e.g. ["signatureOfSmartContractFunction(address,uint)"] receiving the payment
```

### `approvePlugin` Approves a plugin.

`plugin`: Address for the plugin to be approved.

## Plugins

### DePayRouterV1Payment01

Sends a payment to a receiver.

Sends the token of path at the last position (`path[path.length-1]`) for the amount at index 1 (`amounts[1]`) to the address at the last position (`addresses[addresses.length-1]`).

Can also be used to perform token sales from decentralized exchanges by simply setting receiver to equal sender.

Ethereum: [0x99F3F4685a7178F26EB4F4Ca8B75a1724F1577B9](https://etherscan.io/address/0x99f3f4685a7178f26eb4f4ca8b75a1724f1577b9)

BNB Smart Chain: [0x8B127D169D232D5F3ebE1C3D06CE343FD7C1AA11](https://bscscan.com/address/0x8B127D169D232D5F3ebE1C3D06CE343FD7C1AA11)

Polygon (Matic): [0x78C0F1c712A9AA2004C1F401A7307d8bCB62abBd](https://polygonscan.com/address/0x78C0F1c712A9AA2004C1F401A7307d8bCB62abBd)


#### DePayRouterV1PaymentEvent02

Ethereum: [0x6A12C2Cc8AF31f125484EB685F7c0bfcE280B919](https://etherscan.io/address/0x6A12C2Cc8AF31f125484EB685F7c0bfcE280B919)

BNB Smart Chain: [0xF83f63CCf66dfd9ef285E58217352835c470C56C](https://bscscan.com/address/0xF83f63CCf66dfd9ef285E58217352835c470C56C)


### DePayRouterV1PaymentWithEvent01

Sends a payment to a receiver and emits an event (in an atomic way, either both or nothing).

Sends a payment to a receiver.

Sends the token of path at the last position (`path[path.length-1]`) for the amount at index 1 (`amounts[1]`) to the address at the last position (`addresses[addresses.length-1]`).

Can also be used to perform token sales from decentralized exchanges by simply setting receiver to equal sender.

Emits an event as part of the payment with the following structure:

```
event Payment(
  address indexed sender,
  address payable indexed receiver,
  uint256 indexed amount,
  address token
);
```

This plugin takes the address at index 0 (`addresses[0]`) as `sender`,
the address at the last index (`addresses[addresses.length-1]`) as the `receiver`,
the amount at index 1 (`amounts[1]`) as the `amount`,
and the token at the last index (`path[path.length-1]`) as the `token`.

Ethereum: [0xD8fBC10787b019fE4059Eb5AA5fB11a5862229EF](https://etherscan.io/address/0xd8fbc10787b019fe4059eb5aa5fb11a5862229ef)

BNB Smart Chain: [0x1869E236c03eE67B9FfEd3aCA139f4AeBA79Dc21](https://bscscan.com/address/0x1869e236c03ee67b9ffed3aca139f4aeba79dc21)

Polygon (Matic): [0xfAD2F276D464EAdB71435127BA2c2e9dDefb93a4](https://polygonscan.com/address/0xfAD2F276D464EAdB71435127BA2c2e9dDefb93a4)

This plugin uses DePayRouterV1PaymentEvent02 to emit events. If you want to listen to those events you have to do it for the address of [DePayRouterV1PaymentEvent02](#DePayRouterV1PaymentEvent02).


### DePayRouterV1PaymentFee01

Sends a payment fee to a third-party address.

Sends the token of path at the last position (`path[path.length-1]`) for the amount at index 4 (`amounts[4]`) to the address at the previous last position (`addresses[addresses.length-2]`).

Ethereum: [0x874Cb669D7BFff79d4A6A30F4ea52c5e413BD6A7](https://etherscan.io/address/0x874Cb669D7BFff79d4A6A30F4ea52c5e413BD6A7)

BNB Smart Chain: [0xae33f10AD57A38113f74FCdc1ffA6B1eC47B94E3](https://bscscan.com/address/0xae33f10AD57A38113f74FCdc1ffA6B1eC47B94E3)

Polygon (Matic): [0xd625c7087E940b2A91ed8bD8db45cB24D3526B56](https://polygonscan.com/address/0xd625c7087E940b2A91ed8bD8db45cB24D3526B56)


### DePayRouterV1Uniswap01

Swaps TOKEN_A to TOKEN_B, NATIVE to TOKEN or TOKEN to NATIVE on UniswapV2 as part of the payment.

Swaps tokens according to provided `path` using the amount at 0 (`amounts[0]`) as input amount,
the amount at index 1 (`amounts[1]`) as output amount and the amount at index 2 (`amounts[2]`) as deadline.

Ethereum: [0xe04b08Dfc6CaA0F4Ec523a3Ae283Ece7efE00019](https://etherscan.io/address/0xe04b08dfc6caa0f4ec523a3ae283ece7efe00019)

#### Quickswap

Polygon (Matic): [0x0Dfb7137bC64b63F7a0de7Cb9CDa178702666220](https://polygonscan.com/address/0x0Dfb7137bC64b63F7a0de7Cb9CDa178702666220)


### DePayRouterV1PancakeSwap01

Swaps TOKEN_A to TOKEN_B, NATIVE to TOKEN or TOKEN to NATIVE on Pancakeswap as part of the payment.

Swaps tokens according to provided `path` using the amount at 0 (`amounts[0]`) as input amount,
the amount at index 1 (`amounts[1]`) as output amount and the amount at index 2 (`amounts[2]`) as deadline.

BNB Smart Chain: [0xAC3Ec4e420DD78bA86d932501E1f3867dbbfb77B](https://bscscan.com/address/0xAC3Ec4e420DD78bA86d932501E1f3867dbbfb77B)

### DePayRouterV1UniswapV301

Swaps TOKEN_A to TOKEN_B, NATIVE to TOKEN or TOKEN to NATIVE on UniswapV3 as part of the payment.

Swaps tokens according to provided `path` using the amount at 0 (`amounts[0]`) as input amount,
the amount at index 1 (`amounts[1]`).

We do packing in `amounts[2]`. We use 256 bits to store `fee` (`fee` is used to `0xbb8`, `0x2710`) and `sqrtPriceLimitX96`

```
[sqrtPriceLimitX96: uint160] [reversed: 72 bits] [fee: uint24]
```

The amount at index 3 (`amounts[3]`) is the deadline of the swap.

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

Swaps TOKEN_A to TOKEN_B, NATIVE to TOKEN or TOKEN to NATIVE on SuhiSwap (based on Uniswap) as part of the payment.

Swaps tokens according to provided `path` using the amount at index 0 (`amounts[0]`) as input amount,
the amount at index 1 (`amounts[1]`) as output amount and the amount at index 2 (`amounts[2]`) as deadline.

Ethereum: [0xd617fdc26d762ade48Ff54c2E1DE148BFB3F9D22](https://etherscan.io/address/0xd617fdc26d762ade48ff54c2e1de148bfb3f9d22)

### DePayRouterV1OneInchSwap01

Swaps TOKEN_A to TOKEN_B, NATIVE to TOKEN or TOKEN to NATIVE on OneSplitSwap (1Inch Protocol).

Swaps tokens according to provided `path` using the amount at index 0 (`amounts[0]`) as input amount,
the amount at index 1 (`amounts[1]`) as output amount and the amount at index 2 (`amounts[2]`) as flags of 1Inch Protocol.

The rest of remaining elements of `amounts[]` is distribution of 1Inch Protocol.

We need to call: `OneSplitSwap.getExpectedReturn()` to calculate `distribution` of pool and `outAmount`. `outAmount` doesn't the real amount you would be received then we need calculate `expectedAmount` by subtract from `outAmount` three percents to make sure our transaction won't get revert in term of market's adjustment.

Ethereum: [0x8c5d2F0e65275369025c7511c216564beCC8d530](https://etherscan.io/address/0x8c5d2f0e65275369025c7511c216564becc8d530#code)

### DePayRouterV1ApproveAndCallContractAddressAmountBoolean01

To be used to send payments to smart contracts.

Approves target smart contract for token at last index of `path` (`path[path.length-1]`) for amount at index 1 `amounts[1]` and calls smart contract at address index 1 `address[1]`
using method signature passed to `data[0]` (e.g. `stakeAddressAmountBooleanBUSD(address,uint256,bool)`) passing `address` from address at index 0 `address[0]`
`uint256` from amounts at index 1 `amounts[1]` and bool based on passing `"true"` or `"false"` as string via `data[1]`. Resets allowance back to 0 after smart contract has been called.

Ethereum: [0xF984eb8b466AD6c728E0aCc7b69Af6f69B32437F](https://etherscan.io/address/0xf984eb8b466ad6c728e0acc7b69af6f69b32437f)

BNB Smart Chain: [0xd73dFeF8F9c213b449fB39B84c2b33FBBc2C8eD3](https://bscscan.com/address/0xd73dfef8f9c213b449fb39b84c2b33fbbc2c8ed3)

Polygon (Matic): [0x8698E529E9867eEbcC68b4792daC627cd8870736](https://polygonscan.com/address/0x8698E529E9867eEbcC68b4792daC627cd8870736)


### DePayRouterV1ApproveAndCallContractAddressPassedAmountBoolean01

To be used to send payments to smart contracts.

Approves target smart contract for token at last index of `path` (`path[path.length-1]`) for amount at index 1 `amounts[1]` and calls smart contract at address index 1 `address[1]`
using method signature passed to `data[0]` (e.g. `stakeAddressAmountBooleanBUSD(address,uint256,bool)`) passing `address` from address at index 0 `address[0]`
`uint256` from amounts at index 5 `amounts[5]` and bool based on passing `"true"` or `"false"` as string via `data[1]`. Resets allowance back to 0 after smart contract has been called.

Ethereum: [0x2D18c5A46cc1780d2460DD51B5d0996e55Fd2446](https://etherscan.io/address/0x2d18c5a46cc1780d2460dd51b5d0996e55fd2446)

BNB Smart Chain: [0x7E655088214d0657251A51aDccE9109CFd23B5B5](https://bscscan.com/address/0x7e655088214d0657251a51adcce9109cfd23b5b5)

Polygon (Matic): [0xAB305eaDf5FB15AF6370106B231C67d103bBbbbC](https://polygonscan.com/address/0xAB305eaDf5FB15AF6370106B231C67d103bBbbbC)

## Examples

### TOKEN_A to TOKEN_B payment, swapped via Uniswap, with a smart contract receiver (e.g. staking pool)

`path` needs to go through TOKEN_A -> WETH -> TOKEN_B because Uniswap pairs usually share WETH as common route.

Requires to have the token at path index 0 approved for the payment router: `Token(path[0]).approve(ROUTER, MAXINT)`

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

### TOKEN_A to TOKEN_B payment, swapped via Uniswap

https://etherscan.io/tx/0x02fcdb7908cfc8274dfc3fb096fac14ec22f8a459b7962921ba1b26b920cb9d3

`path` needs to go through TOKEN_A -> WETH -> TOKEN_B because Uniswap pairs usually share WETH as common route.

Requires to have the token at path index 0 approved for the payment router: `Token(path[0]).approve(ROUTER, MAXINT)`

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
to avoid depositing swaps into the payment contract itself (without performing an actual payment).

### TOKEN_A to TOKEN_B payment, swapped via Pancakeswap

[https://bscscan.com/tx/0x702e35e3c9759fa8d96c8580223ab8be3043a307fa8152dd68b7374f37db3dc8](https://bscscan.com/tx/0x702e35e3c9759fa8d96c8580223ab8be3043a307fa8152dd68b7374f37db3dc8)

`path` needs to go through TOKEN_A -> WBNB -> TOKEN_B because Pancakeswap pairs usually share WBNB as common route.

Requires to have the token at path index 0 approved for the payment router: `Token(path[0]).approve(ROUTER, MAXINT)`

Get amounts through the Pancakeswap router by passing the same `path` and the desired output amount to receive the required input amount.

```
value: 0

path: ["0xAb4c122a024FeB8Eb3A87fBc7044ad69E51645cB","0xc778417e063141139fce010982780140aa0cd5ab","0x1f9840a85d5af5bf1d1762f925bdaddc4201f984"]

amounts: ["10187046138967433440396","10000000000000000","1711537544"]

addresses: ["0x08B277154218CCF3380CAE48d630DA13462E3950"]

plugins: ["0xc1F6146f45b6EC65FA9E8c8E278bb01879b32268","0x7C9cfd8905E8351303b0bE5D8378b3D453532c44"]

data: []
```

`Gas usage: approx. 220,000`

IMPORTANT: Don't forget to use the actual payment plugin at the end of `plugins`
to avoid depositing swaps into the payment contract itself (without performing an actual payment).

### TOKEN_A to TOKEN_B payment, swapped via CurveFi

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
to avoid depositing swaps into the payment contract itself (without performing an actual payment).

### TOKEN_A to ETH payment, swapped via Uniswap

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
to avoid depositing swaps into the payment contract itself (without performing an actual payment).

### ETH to TOKEN_A payment, swapped via Uniswap

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
to avoid depositing swaps into the payment contract itself (without performing an actual payment).

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

### TOKEN_A to TOKEN_A payment

Ethereum: https://etherscan.io/tx/0x9577d0153edcf5e314b990e248657ca18d6a75c5cae3187617144a3adf2c2ac6

_Consider performing TOKEN_A to TOKEN_A transfers directly if you don't rely on any other plugins or the payment event._

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
to avoid depositing into the payment contract itself without performing an actual payment.

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
to avoid just depositing into the payment contract itself without performing an actual payment.

## Development

### Quick Start

```
yarn install
yarn test
```

### Testing

Test on Ethereum:
```
yarn test:ethereum
```

Test on BSC:
```
yarn test:bsc
```

Test on all blockchains:
```
yarn test
```

Test single files:

```
npx hardhat test test/ethereum/DePayRouterV1.spec.ts --config hardhat.config.ethereum.ts
```

### Deploy

1. `yarn flatten`

2. Deploy flatten contract via https://remix.ethereum.org/
