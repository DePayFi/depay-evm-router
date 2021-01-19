## Deployments

#### Mainnet



#### Ropsten

- [DePayPaymentProcessorV1](https://ropsten.etherscan.io/address/0x1bf897ba922984b7e8bf24a438c291c39cc37836)
- [DePayPaymentProcessorV1Uniswap01](https://ropsten.etherscan.io/address/0x44c21a7e9f7880ca14bf792513cc6b5ca8fc8bb9)

## Quick Start

```
yarn install
yarn test
```

## Summary

This smart contract enables decentralized payment processing.

The main purpose of this smart contract evolves around the `pay` function,
which allows sender to pay a receiver while swapping tokens as part of the same transaction if required.

This enables ETH to ETH, tokenA to tokenA, ETH to tokenA, tokenA to ETH and tokenA to tokenB payments.

Any payment processor, decentralized exchange or liqudity pool protocol can be added to `processors`
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

DEPAY to UNI payment: 
['0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb', '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984']
```

`amountIn`: Amount of tokens payed in from the sender.

`amountOut`: Amount of tokens payed to the receiver.

`receiver`: The receiver address of the payment.

`preProcessors`: List of preProcessors to run before the payment is peformed (e.g. swapping tokens).

`postProcessors`: List of postProcessors to run after the payment is peformed (e.g. conditional checks).

### `approveProcessor` Approves a payment processor.

`processor`: Address for the processor to be approved.

## Examples

### ETH to ETH payment

https://ropsten.etherscan.io/tx/0x4536a913467af525d5fb9ed8a622a41c7ea948fb95d577708122536929a2d8ee

```
value: 0.01

path: [0x0000000000000000000000000000000000000000]

amountIn: 10000000000000000

amountOut: 10000000000000000

receiver: 0x08B277154218CCF3380CAE48d630DA13462E3950

preProcessors: []

postProcessors: []
```

### tokenA to tokenA payment

https://ropsten.etherscan.io/tx/0xfa97893faab1242117a8c62c267fb58081d9deb15781ed486d997bed78271bf3

```
value: 0

path: [0xab4c122a024feb8eb3a87fbc7044ad69e51645cb]

amountIn: 10000000000000000

amountOut: 10000000000000000

receiver: 0x08B277154218CCF3380CAE48d630DA13462E3950

preProcessors: []

postProcessors: []
```

### ETH to tokenA payment

https://ropsten.etherscan.io/tx/0x34f23a5ad4190c32e58d6bf22ab1c643816d9628e13a96192758b373371bf5bf

```
value: 0.00988172

path: [0x0000000000000000000000000000000000000000, 0xab4c122a024feb8eb3a87fbc7044ad69e51645cb]

amountIn: 9881720000000000

amountOut: 1000000000000000000

receiver: 0x08B277154218CCF3380CAE48d630DA13462E3950

preProcessors: [0x44c21a7e9f7880ca14bf792513cc6b5ca8fc8bb9]

postProcessors: []
```

### tokenA to ETH payment

https://ropsten.etherscan.io/tx/0x857ccaaeb1ba4aa9d50724c9a44daa7ce8e36c94c229ecc5122f9f5219c731ae

```
value: 0

path: [0xab4c122a024feb8eb3a87fbc7044ad69e51645cb, 0x0000000000000000000000000000000000000000]

amountIn: 1028452700000000000

amountOut: 10000000000000000

receiver: 0x08B277154218CCF3380CAE48d630DA13462E3950

preProcessors: [0x44c21a7e9f7880ca14bf792513cc6b5ca8fc8bb9]

postProcessors: []
```

### tokenA to tokenB payment

https://ropsten.etherscan.io/tx/0x430ba93f0656f2f941c933ae79067aabbc24185316f7e33274e33a4cbb7da077

`path` needs to go trough tokenA -> WETH -> tokenB if processed by Uniswap.

```
value: 0

path: [0xab4c122a024feb8eb3a87fbc7044ad69e51645cb, 0xc778417e063141139fce010982780140aa0cd5ab, 0x1f9840a85d5af5bf1d1762f925bdaddc4201f984]

amountIn: 903657000000000000

amountOut: 7000000000000000

receiver: 0x08B277154218CCF3380CAE48d630DA13462E3950

preProcessors: [0x44c21a7e9f7880ca14bf792513cc6b5ca8fc8bb9]

postProcessors: []
```

## Deploy

1. `yarn flatten`

2. Deploy flatten contract via https://remix.ethereum.org/
