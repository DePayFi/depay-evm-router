import { 
  deployContract,
} from 'ethereum-waffle'

import { routerFixture } from './router'

import DePayRouterV1Payment01 from '../../artifacts/contracts/DePayRouterV1Payment01.sol/DePayRouterV1Payment01.json'

export async function paymentFixture() {
  const {router, configuration, ownerWallet, otherWallet} = await routerFixture()
  const paymentPlugin = await deployContract(ownerWallet, DePayRouterV1Payment01)
  await configuration.connect(ownerWallet).approvePlugin(paymentPlugin.address)
  return {
    router,
    configuration,
    ownerWallet,
    otherWallet,
    paymentPlugin
  }
}
