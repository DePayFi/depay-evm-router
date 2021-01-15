Mainnet:

Ropsten:


## Quick Start

```
yarn install
yarn test
```

## Summary

This smart contract enables decentralized payment processing.

The main functionality evolves around the `pay` function.


## Functions

### `pay` Sender pays a receiver

The main function for processing payments.

Arguments:

`path`: The path of the token conversion.

```
ETH to ETH payment: `['0x0000000000000000000000000000000000000000']`

ETH to DEPAY payment: `['0x0000000000000000000000000000000000000000', '0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb']`

DEPAY to UNI payment: `['0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb', '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984']`
```

`amountIn`: Amount of tokens payed in from the sender.

`amountOut`: Amount of tokens payed to the receiver.

`amountOut`: Amount of tokens payed to the receiver.

EXAMPLE TRANSACTIONS HERE

## Deploy

1. `yarn flatten`

2. Deploy flatten contract via https://remix.ethereum.org/
