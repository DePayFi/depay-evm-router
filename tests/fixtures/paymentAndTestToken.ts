//@ts-ignore
import { waffle } from 'hardhat'

const { deployContract } = waffle

import { paymentFixture } from './payment'

import TestToken from '../../artifacts/contracts/test/TestToken.sol/TestToken.json'

export async function paymentAndTestTokenFixture() {
  const {router, configuration, ownerWallet, otherWallet, paymentPlugin} = await paymentFixture()
  const testTokenContract = await deployContract(ownerWallet, TestToken)
  return {
    router,
    configuration,
    ownerWallet,
    otherWallet,
    paymentPlugin,
    testTokenContract,
  }
}
