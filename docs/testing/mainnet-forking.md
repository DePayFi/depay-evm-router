# Motivation

DeFi have many complex platforms, each platform is also connect to each other, somehow our effort in development is wasting to clone existing platform on Ropsten.

Apparently `hardhat-waffle` is good but it's cost us too much to write fixture and write mock contracts. Even we wrote test cases we're always need to test once again with our cloned platforms on Ropsten.

Let's consider a trade-off where we sacrifice testing performance in exchange for better code coverage for mainnet environment.

Testing with mainnet's context could reduce development cost which were we spent on fixture, mock contracts, understand third party platform code, clone non-existing platform on Ropsten.

We're also able to unlock any address, that allow us to have infinity tokens for testing.

## Environment variable

We need `.env` file contain following this content

- **NODE_ENV**: Node environment, it will be reversed for further CI/CD or deployment: e.g `development`, `production`, `stagging`.
- **DEPAY_MNEMONIC**: 12 words passphrase.
- **DEPAY_RPC_URL**: Ethereum JSON RPC provider

## Network context

Here is a file contain hard code of existing smart contracts on mainnet, located at: `./test/helpers/network-context.ts`

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

It's singleton so never mind about performance. There are some address need to read from blockchain so you could found it's empty in hard code addresses.

## Unlock address

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

## Deploy & load contract

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

There are two possible ways,

Get contract by name. It will try to lookup in network context for related address:

```typescript
function getContractByName(queryString: string, network: string = 'mainnet')
```

Get contract instance by name and address:

```typescript
function getContractByNameAddAddress(contractName: string, contractAddress: string = zeroAddress): Promise<Contract>
```

## Reference

- [Hardhat Mainnet Forking](https://hardhat.org/guides/mainnet-forking.html)
