# DePay's EVM Web3 Payment Router.

## Deployments

Optimization Level: 800,000

### DePayRouterV2

Ethereum:
- [0xF491525C7655f362716335D526E57b387799d058](https://etherscan.io/address/0xF491525C7655f362716335D526E57b387799d058)

BNB Smart Chain:
- [0xdb3f47b1D7B577E919D639B4FD0EBcEFD4aABb70](https://bscscan.com/address/0xdb3f47b1D7B577E919D639B4FD0EBcEFD4aABb70)

Polygon (POS):
- [0x39E7C98BF4ac3E4C394dD600397f5f7Ee3779BE8](https://polygonscan.com/address/0x39E7C98BF4ac3E4C394dD600397f5f7Ee3779BE8)

Avalanche:
- [0x5EC3153BACebb5e49136cF2d457f26f5Df1B6780](https://snowtrace.io/address/0x5EC3153BACebb5e49136cF2d457f26f5Df1B6780)

Fantom:
- [0x78C0F1c712A9AA2004C1F401A7307d8bCB62abBd](https://ftmscan.com/address/0x78C0F1c712A9AA2004C1F401A7307d8bCB62abBd)

Gnosis:
- [0x5EC3153BACebb5e49136cF2d457f26f5Df1B6780](https://gnosisscan.io/address/0x5EC3153BACebb5e49136cF2d457f26f5Df1B6780)

Optimsm:
- [0x5EC3153BACebb5e49136cF2d457f26f5Df1B6780](https://optimistic.etherscan.io/address/0x5EC3153BACebb5e49136cF2d457f26f5Df1B6780)

Arbitrum:
- [0x5EC3153BACebb5e49136cF2d457f26f5Df1B6780](https://arbiscan.io/address/0x5EC3153BACebb5e49136cF2d457f26f5Df1B6780)

### DePayForwarderV2

Ethereum:
- [0xDAC2064178831b8C2Ed5f08b7Cf207C01A989b23](https://etherscan.io/address/0xDAC2064178831b8C2Ed5f08b7Cf207C01A989b23)

BNB Smart Chain:
- [0x9E710397d1Ea1A4Dc098Fd0d575E0d26886fd0C0](https://bscscan.com/address/0x9E710397d1Ea1A4Dc098Fd0d575E0d26886fd0C0)

Polygon (POS):
- [0x376d6B0F8c9b829aAb0a7478952DEF1F8656D7c4](https://polygonscan.com/address/0x376d6B0F8c9b829aAb0a7478952DEF1F8656D7c4)

Avalanche:
- [0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb](https://snowtrace.io/address/0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb)

Fantom:
- [0x2CA727BC33915823e3D05fe043d310B8c5b2dC5b](https://ftmscan.com/address/0x2CA727BC33915823e3D05fe043d310B8c5b2dC5b)

Gnosis:
- [0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb](https://gnosisscan.io/address/0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb)

Optimsm: 
- [0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb](https://optimistic.etherscan.io/address/0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb)

Arbitrum:
- [0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb](https://arbiscan.io/address/0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb)

## Summary

This smart contract enables decentralized payments with auto-conversion and payment-fee extraction.

The main purpose of this smart contract evolves around the `pay` function.

This smart contract allows for NATIVE to NATIVE, NATIVE to TOKEN, TOKEN to NATIVE, WRAPPED to NATIVE, NATIVE to WRAPPED and TOKEN_A to TOKEN_B payments.

#### Transfer polyfil

The `DePayRouterV2` emits a `Transfer` event for payments where the receiver token is the native token of the respective chain (e.g. Ether on Ethereum).

This allows to validate native token transfers without checking for internal transfers, but instead rely on Transfer events known from Token transfers.

Standard tokens (e.g. ERC20 etc.) already do emit `Transfer` events as part of their standard.

## Development

Create an `.env` file with the following content:
```
NODE_ENV=development

MNEMONIC="shine romance erase resource daring bean talk right cupboard visa renew galaxy"
#(0) 0xdde3dc4308A7856D49D1d7303bB630Bccb45Caf9
#(1) 0x26Fe22F655303151C2ef3b2D097F842ab27Ef940
#(2) 0x877a79C20028F9ef81e956B43B917703cC22A07A
#(3) 0x3a36b51c5125A9c064f4Cd2F492989618CF7660E

ARBITRUM_NOVA_RPC_URL=https://arbitrum-nova.blastapi.io/<APIKEY>
ARBITRUM_ONE_RPC_URL=https://arbitrum-one.blastapi.io/<APIKEY>
AVALANCHE_RPC_URL=https://ava-mainnet.blastapi.io/<APIKEY>/ext/bc/C/rpc
BSC_RPC_URL=https://bsc-mainnet.blastapi.io/<APIKEY>
ETHEREUM_RPC_URL=https://eth-mainnet.blastapi.io/<APIKEY>
FANTOM_RPC_URL=https://fantom-mainnet.blastapi.io/<APIKEY>
GNOSIS_RPC_URL=https://gnosis-mainnet.blastapi.io/<APIKEY>
OPTIMISM_RPC_URL=https://optimism.blockpi.network/v1/rpc/public
POLYGON_RPC_URL=https://polygon-mainnet.blastapi.io/<APIKEY>
POLYGON_ZKEVM_RPC_URL=https://polygon-zkevm-mainnet.blastapi.io/<APIKEY>
ZKSYNC_ERA_RPC_URL=https://mainnet.era.zksync.io
```

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

