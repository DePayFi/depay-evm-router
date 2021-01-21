## Deployments

#### Mainnet

#### Ropsten

- [DePayPaymentProcessorV1](https://ropsten.etherscan.io/address/0x035378ca0e7406cf84817fe81d1e72c34a80380e)
- [DePayPaymentProcessorV1Uniswap01](https://ropsten.etherscan.io/address/0xe980585aacf256e55107052bcdfe24966bcbb5f0)

## Quick Start

```
yarn install
yarn test
```

## Summary

This smart contract enables decentralized payment processing.

The main purpose of this smart contract evolves around the `pay` function,
which allows a sender to pay a receiver while swapping tokens as part of the same transaction if required.

This enables ETH to ETH, tokenA to tokenA, ETH to tokenA, tokenA to ETH and tokenA to tokenB payments.

Any payment processor, decentralized exchange or liqudity pool protocol can be added to `processors` using `approveProcessor`
to improve cost-effectiveness of payment routing.

## Functions

### `pay` Sender pays a receiver

The main function to process payments.

Arguments:

`path`: The path of the token conversion.

```
ETH to ETH payment: 
['0x0000000000000000000000000000000000000000']

DEPAY to DEPAY payment: 
['0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb']

ETH to DEPAY payment: 
['0x0000000000000000000000000000000000000000', '0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb']

DEPAY to ETH payment: 
['0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb', '0x0000000000000000000000000000000000000000']

DEPAY to UNI payment (processing goes through WETH): 
['0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb', '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984']
```

`amountIn`: Amount of tokens payed in from the sender.

`amountOut`: Amount of tokens payed to the receiver.

`receiver`: The receiver address of the payment.

`preProcessors`: List of preProcessors to run before the payment is peformed (e.g. swapping tokens).

`postProcessors`: List of postProcessors to run after the payment is peformed (e.g. conditional checks).

### `approveProcessor` Approves a payment processor.

`processor`: Address for the processor to be approved.

## Examples

### tokenA to tokenB payment

https://ropsten.etherscan.io/tx/0xe2b1e8e6b4346f1b82b629e1983049d70a9da33f52d8f8d5ffa96b083967e7e7

`path` needs to go trough tokenA -> WETH -> tokenB if processed by Uniswap.

```
value: 0

path: [0xab4c122a024feb8eb3a87fbc7044ad69e51645cb, 0xc778417e063141139fce010982780140aa0cd5ab, 0x1f9840a85d5af5bf1d1762f925bdaddc4201f984]

amounts: [903657000000000000,7000000000000000]

receiver: 0x08B277154218CCF3380CAE48d630DA13462E3950

processors: [[0x51441149c7ac09197CdF30C7970f7252DcF5b212],[]]

deadline: 1611537544
```

### tokenA to ETH payment

https://ropsten.etherscan.io/tx/0x2818223405964a8a474af361febc784f4f389888fa80d1aca6ea41bf1315503c

```
value: 0

path: [0xab4c122a024feb8eb3a87fbc7044ad69e51645cb, 0x0000000000000000000000000000000000000000]

amountIn: 1028452700000000000

amountOut: 10000000000000000

receiver: 0x08B277154218CCF3380CAE48d630DA13462E3950

preProcessors: [0x51441149c7ac09197CdF30C7970f7252DcF5b212]

postProcessors: []
```

### ETH to tokenA payment

https://ropsten.etherscan.io/tx/0x5a9f41cfeaae2d9686f5f438f1a76bd4f867157b4944e392fe6eba76d09befe0

```
value: 0.00988172

path: [0x0000000000000000000000000000000000000000, 0xab4c122a024feb8eb3a87fbc7044ad69e51645cb]

amountIn: 9881720000000000

amountOut: 1000000000000000000

receiver: 0x08B277154218CCF3380CAE48d630DA13462E3950

preProcessors: [0x51441149c7ac09197CdF30C7970f7252DcF5b212]

postProcessors: []
```

### tokenA to tokenA payment

https://ropsten.etherscan.io/tx/0x9ab2c71e0967b657fb976fb7b45e372ab792b5851e5991cd3c642b1bdca841cc

_Consider performing tokenA to tokenA transfers directly if you don't rely on any other processors or the Payment event._

_Needs spending approval on tokenA contract first._

```
value: 0

path: [0xab4c122a024feb8eb3a87fbc7044ad69e51645cb]

amountIn: 10000000000000000

amountOut: 10000000000000000

receiver: 0x08B277154218CCF3380CAE48d630DA13462E3950

preProcessors: []

postProcessors: []
```

### ETH to ETH payment

https://ropsten.etherscan.io/tx/0x96df3afbbdb6e1ffab1662b2f09dc41429e8caf287b2933aab1e3c5b818e4390

_Consider performing ETH to ETH transfers directly if you don't rely on any other processors or the Payment event._

```
value: 0.01

path: [0x0000000000000000000000000000000000000000]

amountIn: 10000000000000000

amountOut: 10000000000000000

receiver: 0x08B277154218CCF3380CAE48d630DA13462E3950

preProcessors: []

postProcessors: []
```

## Deploy

1. `yarn flatten`

2. Deploy flatten contract via https://remix.ethereum.org/
