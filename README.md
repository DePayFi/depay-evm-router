## Deployments

#### Mainnet

#### Ropsten

- [DePayPaymentProcessorV1](https://ropsten.etherscan.io/address/0x29cdb0ee2238cde0fb7b68f04d4d79a7c7ab3cca)
- [DePayPaymentProcessorV1Uniswap01](https://ropsten.etherscan.io/address/0xf1b8bbd33b060ca04f85681b771223c49802075f)

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

https://ropsten.etherscan.io/tx/0x60a5820629be6e73c984d23e5f0cc943ccd5981cba9210f86bd713c9a873dac3

`path` needs to go through tokenA -> WETH -> tokenB if processed by Uniswap.

```
value: 0

path: [0xab4c122a024feb8eb3a87fbc7044ad69e51645cb,0xc778417e063141139fce010982780140aa0cd5ab,0x1f9840a85d5af5bf1d1762f925bdaddc4201f984]

amounts: [903657000000000000,7000000000000000]

receiver: 0x08B277154218CCF3380CAE48d630DA13462E3950

preProcessors: [0xF1B8BBd33B060cA04f85681b771223c49802075F]

postProcessors: []

deadline: 1611537544
```

### tokenA to ETH payment

https://ropsten.etherscan.io/tx/0x306770faa3818baf40615ffa04e7f5275a9458b7a8181ca7d3f9a6341acd5191

```
value: 0

path: [0xab4c122a024feb8eb3a87fbc7044ad69e51645cb,0x0000000000000000000000000000000000000000]

amounts: [1128452700000000000,9000000000000000]

receiver: 0x08B277154218CCF3380CAE48d630DA13462E3950

preProcessors: [0xF1B8BBd33B060cA04f85681b771223c49802075F]

postProcessors: []

deadline: 1611537544
```

### ETH to tokenA payment

https://ropsten.etherscan.io/tx/0x6306bb636a300800ec5a79c65c69612c1ef6227f20aad34cd36ca70b76c93c35

```
value: 0.00988172

path: [0x0000000000000000000000000000000000000000,0xab4c122a024feb8eb3a87fbc7044ad69e51645cb]

amounts: [9881720000000000,1000000000000000000]

receiver: 0x08B277154218CCF3380CAE48d630DA13462E3950

preProcessors: [0xF1B8BBd33B060cA04f85681b771223c49802075F]

postProcessors: []

deadline: 1611537544
```

### tokenA to tokenA payment

https://ropsten.etherscan.io/tx/0x24713fe545b5baf68095206b39f493856a3429269aad213c7bd7b56ab9d38a30

_Consider performing tokenA to tokenA transfers directly if you don't rely on any other processors or the Payment event._

_Needs spending approval on tokenA contract first._

```
value: 0

path: [0xab4c122a024feb8eb3a87fbc7044ad69e51645cb]

amounts: [10000000000000000,10000000000000000]

receiver: 0x08B277154218CCF3380CAE48d630DA13462E3950

preProcessors: []

postProcessors: []
```

### ETH to ETH payment



_Consider performing ETH to ETH transfers directly if you don't rely on any other processors or the Payment event._

```
value: 0.01

path: [0x0000000000000000000000000000000000000000]

amounts: [10000000000000000,10000000000000000]

receiver: 0x08B277154218CCF3380CAE48d630DA13462E3950

preProcessors: []

postProcessors: []
```

## Deploy

1. `yarn flatten`

2. Deploy flatten contract via https://remix.ethereum.org/
