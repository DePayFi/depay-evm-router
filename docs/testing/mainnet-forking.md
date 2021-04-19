# Motivation

In DeFi you have many complex platforms which are interconnected with each other.

Often we waste time in development to clone existing platforms to Ropsten.

Apparently `hardhat-waffle` is good but it costs us too much time to write fixtures and mock contracts for very complex DeFi protocols.

Even if we write test-cases, we always need to test once again with cloned platforms and protocols on Ropsten.

Let's consider a trade-off where we sacrifice testing performance in exchange for better code coverage for mainnet environment.

Testing with a mainnet clone, within the mainnet context can reduce development cost, especially time spent on writing fixtures, mock contracts, trying to understand the internals of third party platform code and deploying other third party platforms to Ropsten.

When cloning mainnet for testing, we are also able to unlock any address, which allows us to have infinity tokens for testing.

## Environment variables

We need `.env` file contain following this content

- **NODE_ENV**: Node environment, it will be reversed for further CI/CD or deployment: e.g `development`, `production`, `stagging`.
- **DEPAY_MNEMONIC**: 12 words passphrase.
- **DEPAY_RPC_URL**: Ethereum JSON RPC provider

E.g:

```
NODE_ENV=development

#(0) 0xdde3dc4308A7856D49D1d7303bB630Bccb45Caf9
#(1) 0x26Fe22F655303151C2ef3b2D097F842ab27Ef940
#(2) 0x877a79C20028F9ef81e956B43B917703cC22A07A
#(3) 0x3a36b51c5125A9c064f4Cd2F492989618CF7660E
DEPAY_MNEMONIC="shine romance erase resource daring bean talk right cupboard visa renew galaxy"

DEPAY_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/ALCHEMY_API_KEY
```

## Network context

The following file initalizes a required network context when forking locally: `./test/helpers/network-context.ts`

Usage:

```typescript
import { initContext } from './helpers/network-context'

describe('Contract', () => {
  it('Context should be loaded correctly', async () => {
    const networkContext = await initContext()
    console.log(networkContext)
  })
})
```

Its a singleton so don't mind about performance.

There are some address that can't be hardcoded, like depayOwnerWallet, those need to be read from the blockchain after forking it.

## Unlock addresses

```typescript
import { unlockSigner } from './helpers/network-context'

describe('Contract', () => {
  it('I should able to unlock zero address', async () => {
    const zeroAddress = await unlockSigner('zeroAddress', '0x0000000000000000000000000000000000000000')
  })

  it('I should able to access unlocked address by alias', async () => {
    const zeroAddress = await unlockSigner('zeroAddress')
  })
})
```

## Contracts

### Deploy new contract

```typescript
import hre from 'hardhat'
import { contractDeploy } from './helpers/network-context'

describe('Contract', () => {
  it('should able to deploy 1inch swap plugin on mainnet forking', async () => {
    const [ownerWallet] = await hre.ethers.getSigners()
    depayOneInchSwap = <DePayRouterV1OneInchSwap>(
      await contractDeploy(ownerWallet, 'DePayRouterV1OneInchSwap', networkContext.OneSplitAudit)
    )
  })
})
```

### Load existed contract on mainnet

There are two possible ways:

1. Get a contract by name. It will try to lookup in network context for related address:

```typescript
function getContractByName(queryString: string, network: string = 'mainnet')
```

2. Get a contract instance by name and address:

```typescript
function getContractByNameAddAddress(contractName: string, contractAddress: string = zeroAddress): Promise<Contract>
```

## Reference

- [Hardhat Mainnet Forking](https://hardhat.org/guides/mainnet-forking.html)
