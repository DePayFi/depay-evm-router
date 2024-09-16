# DePay's EVM Web3 Payment Router.

## Deployments

Optimization Level: 800,000

### DePayRouterV3

Enables Web3 Payments.

Ethereum:
- [](https://etherscan.io/address/)

BNB Smart Chain:
- [](https://bscscan.com/address/)

Polygon (POS):
- [](https://polygonscan.com/address/)

Avalanche:
- [](https://snowtrace.io/address/)

Fantom:
- [](https://ftmscan.com/address/)

Gnosis:
- [](https://gnosisscan.io/address/)

Optimism:
- [](https://optimistic.etherscan.io/address/)

Arbitrum:
- [](https://arbiscan.io/address/)

Base:
- [](https://basescan.org/address/)

### DePayForwarderV3

DePayForwarderV2 allows to pay into smart contracts.

Ethereum:
- [](https://etherscan.io/address/)

BNB Smart Chain:
- [](https://bscscan.com/address/)

Polygon (POS):
- [](https://polygonscan.com/address/)

Avalanche:
- [](https://snowtrace.io/address/)

Fantom:
- [](https://ftmscan.com/address/)

Gnosis:
- [](https://gnosisscan.io/address/)

Optimism: 
- [](https://optimistic.etherscan.io/address/)

Arbitrum:
- [](https://arbiscan.io/address/)

Base:
- [](https://basescan.org/address/)

### DePayWETHExchangeV1

DePayWETHExchangeV1 allows to swap WETH<>ETH both ways for payments.

Ethereum:
- [0x298f4980525594b3b982779cf74ba76819708D43](https://etherscan.io/address/0x298f4980525594b3b982779cf74ba76819708D43)

BNB Smart Chain:
- [0xeEb80d14abfB058AA78DE38813fe705c3e3b243E](https://bscscan.com/address/0xeEb80d14abfB058AA78DE38813fe705c3e3b243E)

Polygon (POS):
- [0xaE59C9d3E055BdFAa583E169aA5Ebe395689476a](https://polygonscan.com/address/0xaE59C9d3E055BdFAa583E169aA5Ebe395689476a)

Avalanche:
- [0x2d0a6275eaDa0d03226919ce6D93661E589B2d59](https://snowtrace.io/address/0x2d0a6275eaDa0d03226919ce6D93661E589B2d59)

Fantom:
- [0x2d0a6275eaDa0d03226919ce6D93661E589B2d59](https://ftmscan.com/address/0x2d0a6275eaDa0d03226919ce6D93661E589B2d59)

Gnosis:
- [0x2d0a6275eaDa0d03226919ce6D93661E589B2d59](https://gnosisscan.io/address/0x2d0a6275eaDa0d03226919ce6D93661E589B2d59)

Optimism: 
- [0x69594057e2C0224deb1180c7a5Df9ec9d5B611B5](https://optimistic.etherscan.io/address/0x69594057e2C0224deb1180c7a5Df9ec9d5B611B5)

Arbitrum:
- [0x7E655088214d0657251A51aDccE9109CFd23B5B5](https://arbiscan.io/address/0x7E655088214d0657251A51aDccE9109CFd23B5B5)

Base:
- [0xD1711710843B125a6a01FfDF9b95fDc3064BeF7A](https://basescan.org/address/0xD1711710843B125a6a01FfDF9b95fDc3064BeF7A)

## Summary

This smart contract enables decentralized payments with auto-conversion and payment-fee extraction.

The main purpose of this smart contract evolves around the `pay` function.

This smart contract allows for NATIVE to NATIVE, NATIVE to TOKEN, TOKEN to NATIVE, WRAPPED to NATIVE, NATIVE to WRAPPED and TOKEN_A to TOKEN_B payments.

#### Payment event

The `DePayRouterV3` emits a `Payment` event for all payments:

```
event Payment(
  address indexed from,
  address indexed to,
  uint256 indexed deadline,
  uint256 amountIn,
  uint256 paymentAmount,
  uint256 feeAmount,
  uint256 protocolAmount,
  address tokenInAddress,
  address tokenOutAddress,
  address feeReceiverAddress
);
```

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
npx hardhat test test/ethereum/pay_with_native.spec.ts --config hardhat.config.ethereum.ts
```

### Deploy

1. `yarn flatten`

2. Deploy flatten contract

