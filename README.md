# DePay's EVM Web3 Payment Router.

## Deployments

`DePayRouterV2`

Ethereum: [](https://etherscan.io/address/)

BNB Smart Chain: [](https://bscscan.com/address/)

Polygon (POS): [](https://polygonscan.com/address/)

## Summary

This set of smart contracts enables decentralized payments.

The main purpose of this set of smart contracts evolves around the `pay` function,
which allows a sender to pay a receiver with any convertible token

This allows for NATIVE to NATIVE, NATIVE to TOKEN, TOKEN to NATIVE and TOKEN_A to TOKEN_B payments.

## Functionalities

### pay

The main function to route payments.

Arguments:

`path`: The path of the token conversion:

```
```

#### Transfer polyfil (internal transfers)

The `DePayRouterV2` emits a `Transfer` event only for payments (pay outs) with the native token (e.g. ether).

This is done to not rely on scanning for internal transfers, but to to rely on transfer events for token + native transfers.

Other tokens already do emit `Transfer` events as part of their standard.

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
npx hardhat test test/ethereum/DePayRouterV1.spec.ts --config hardhat.config.ethereum.ts
```

### Deploy

1. `yarn flatten`

2. Deploy flatten contract via https://remix.ethereum.org/

