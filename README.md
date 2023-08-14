# DePay's EVM Web3 Payment Router.

## Deployments

Optimization Level: 800,000

### DePayRouterV2

Ethereum:
[](https://etherscan.io/address/)

BNB Smart Chain: [](https://bscscan.com/address/)

Polygon (POS): [](https://polygonscan.com/address/)

Avalanche: [](https://snowtrace.io/address/)

Fantom: [](https://ftmscan.com/address/)

Gnosis: [](https://gnosisscan.io/address/)

Optimsm: [](https://optimistic.etherscan.io/address/)

Arbitrum: [](https://arbiscan.io/address/)

### DePayForwarderV2

Ethereum: [](https://etherscan.io/address/)

BNB Smart Chain:<br/>
[0x9E710397d1Ea1A4Dc098Fd0d575E0d26886fd0C0](https://bscscan.com/address/0x9E710397d1Ea1A4Dc098Fd0d575E0d26886fd0C0)

Polygon (POS): [](https://polygonscan.com/address/)

Avalanche: [0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb](https://snowtrace.io/address/0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb)

Fantom: [0x2CA727BC33915823e3D05fe043d310B8c5b2dC5b](https://ftmscan.com/address/0x2CA727BC33915823e3D05fe043d310B8c5b2dC5b)

Gnosis: [](https://gnosisscan.io/address/)

Optimsm: [0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb](https://optimistic.etherscan.io/address/0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb)

Arbitrum: [0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb](https://arbiscan.io/address/0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb)

## Summary

This smart contract enables decentralized payments with auto-conversion and payment-fee extraction.

The main purpose of this smart contract evolves around the `pay` function.

This smart contract allows for NATIVE to NATIVE, NATIVE to TOKEN, TOKEN to NATIVE, WRAPPED to NATIVE, NATIVE to WRAPPED and TOKEN_A to TOKEN_B payments.

#### Transfer polyfil

The `DePayRouterV2` emits a `Transfer` event for payments where the receiver token is the native token of the respective chain (e.g. Ether on Ethereum).

This allows to validate native token transfers without checking for internal transfers, but instead rely on Transfer events known from Token transfers.

Standard tokens (e.g. ERC20 etc.) already do emit `Transfer` events as part of their standard.

## Development

### Quick Start

```
yarn install
yarn test
```

### Testing

Test on a specific chain:
```
yarn test:<chain>
```

e.g. `ethereum`, `bsc` etc.

Test on all blockchains:

```
yarn test
```

Test single files:

```
npx hardhat test test/bsc/pay_with_exchange_conversion.spec.ts --config hardhat.config.bsc.ts
```

### Deploy

1. `yarn flatten`

2. Deploy flatten contract via https://remix.ethereum.org/

