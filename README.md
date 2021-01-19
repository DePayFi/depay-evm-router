## Deployments

#### Mainnet



#### Ropsten

- [DePayPaymentProcessorV1](https://ropsten.etherscan.io/address/0x1377bdaa5fcff2bf63dbc6bcfe6d0516ddf84a23)
- [DePayPaymentProcessorV1Uniswap01](https://ropsten.etherscan.io/address/0xf3c6a559860d5e63eb24cfcbf8bfabb9a882bcc0)

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

## Functions

### `pay` Sender pays a receiver

The main function for processing payments.

Arguments:

`path`: The path of the token conversion.

```
ETH to ETH payment: 
['0x0000000000000000000000000000000000000000']

DEPAY to DEPAY payment: 
['0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb']

ETH to DEPAY payment: 
['0x0000000000000000000000000000000000000000', '0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb']

DEPAY to UNI payment: 
['0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb', '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984']

DEPAY to ETH payment: 
['0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb', '0x0000000000000000000000000000000000000000']
```

`amountIn`: Amount of tokens payed in from the sender.

`amountOut`: Amount of tokens payed to the receiver.

`receiver`: The receiver address of the payment.

## Examples

## Deploy

1. `yarn flatten`

2. Deploy flatten contract via https://remix.ethereum.org/
