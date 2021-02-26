import { 
  deployContract
} from 'ethereum-waffle'

import { routerFixture } from './router'

import TestToken from '../../artifacts/contracts/test/TestToken.sol/TestToken.json'

export async function testTokenFixture() {
  const {router, configuration, ownerWallet, otherWallet} = await routerFixture()
  const testTokenContract = await deployContract(ownerWallet, TestToken)
  return {
    router,
    configuration,
    ownerWallet,
    otherWallet,
    testTokenContract,
  }
}
