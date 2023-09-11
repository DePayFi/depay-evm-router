# DePay's EVM Web3 Payment Router.

## Deployments

Optimization Level: 800,000

### DePayRouterV2

Ethereum:
- [0x6466F27B169C908Ba8174d80aEfa7173CbC3D0c7](https://etherscan.io/address/0x6466F27B169C908Ba8174d80aEfa7173CbC3D0c7)

BNB Smart Chain:
- [0x7ea09401db4692a8AEF4111b75bD32AE758f552A](https://bscscan.com/address/0x7ea09401db4692a8AEF4111b75bD32AE758f552A)

Polygon (POS):
- [0x50CFAB577623B1359602E11514a9482B061A941e](https://polygonscan.com/address/0x50CFAB577623B1359602E11514a9482B061A941e)

Avalanche:
- [0xFee05C41195985909DDfc9127Db1f94559c46db3](https://snowtrace.io/address/0xFee05C41195985909DDfc9127Db1f94559c46db3)

Fantom:
- [0xFee05C41195985909DDfc9127Db1f94559c46db3](https://ftmscan.com/address/0xFee05C41195985909DDfc9127Db1f94559c46db3)

Gnosis:
- [0xFee05C41195985909DDfc9127Db1f94559c46db3](https://gnosisscan.io/address/0xFee05C41195985909DDfc9127Db1f94559c46db3)

Optimism:
- [0x8698E529E9867eEbcC68b4792daC627cd8870736](https://optimistic.etherscan.io/address/0x8698E529E9867eEbcC68b4792daC627cd8870736)

Arbitrum:
- [0xA1cfbeeF344A52e18f748fd6a126f9426A40fbc7](https://arbiscan.io/address/0xA1cfbeeF344A52e18f748fd6a126f9426A40fbc7)

Base:
- [0x8B127D169D232D5F3ebE1C3D06CE343FD7C1AA11](https://basescan.org/address/0x8B127D169D232D5F3ebE1C3D06CE343FD7C1AA11)

### DePayForwarderV2

Ethereum:
- [0x4D130ae9C3Dcf86e2aE406F16bFbcC798e77C657](https://etherscan.io/address/0x4D130ae9C3Dcf86e2aE406F16bFbcC798e77C657)

BNB Smart Chain:
- [0xA3667687D81972E208a5b206aD8b0faeC18cd435](https://bscscan.com/address/0xA3667687D81972E208a5b206aD8b0faeC18cd435)

Polygon (POS):
- [0x5a5Eb8AcA5Ebb5D98C752eC2343faE31262B58c9](https://polygonscan.com/address/0x5a5Eb8AcA5Ebb5D98C752eC2343faE31262B58c9)

Avalanche:
- [0xA1cfbeeF344A52e18f748fd6a126f9426A40fbc7](https://snowtrace.io/address/0xA1cfbeeF344A52e18f748fd6a126f9426A40fbc7)

Fantom:
- [0xA1cfbeeF344A52e18f748fd6a126f9426A40fbc7](https://ftmscan.com/address/0xA1cfbeeF344A52e18f748fd6a126f9426A40fbc7)

Gnosis:
- [0xA1cfbeeF344A52e18f748fd6a126f9426A40fbc7](https://gnosisscan.io/address/0xA1cfbeeF344A52e18f748fd6a126f9426A40fbc7)

Optimism: 
- [0xAC3Ec4e420DD78bA86d932501E1f3867dbbfb77B](https://optimistic.etherscan.io/address/0xAC3Ec4e420DD78bA86d932501E1f3867dbbfb77B)

Arbitrum:
- [0x8698E529E9867eEbcC68b4792daC627cd8870736](https://arbiscan.io/address/0x8698E529E9867eEbcC68b4792daC627cd8870736)

Base:
- [0x0Dfb7137bC64b63F7a0de7Cb9CDa178702666220](https://basescan.org/address/0x0Dfb7137bC64b63F7a0de7Cb9CDa178702666220)

## Summary

This smart contract enables decentralized payments with auto-conversion and payment-fee extraction.

The main purpose of this smart contract evolves around the `pay` function.

This smart contract allows for NATIVE to NATIVE, NATIVE to TOKEN, TOKEN to NATIVE, WRAPPED to NATIVE, NATIVE to WRAPPED and TOKEN_A to TOKEN_B payments.

#### Transfer polyfil

The `DePayRouterV2` emits a `InternalTransfer` event for payments where the receiver token is the native token of the respective chain (e.g. Ether on Ethereum).

This allows to validate native token transfers without checking for internal transfers, but instead rely on `InternalTransfer` events, similiar to Token `Transfer` events.

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

2. Deploy flatten contract

