import { 
  deployContract,
} from 'ethereum-waffle'

import { paymentFixture } from './payment'

import DePayRouterV1PaymentEvent01 from '../../artifacts/contracts/DePayRouterV1PaymentEvent01.sol/DePayRouterV1PaymentEvent01.json'

export async function paymentEventFixture() {
  const {router, configuration, ownerWallet, otherWallet, paymentPlugin} = await paymentFixture()
  const paymentEventPlugin = await deployContract(ownerWallet, DePayRouterV1PaymentEvent01)
  await configuration.connect(ownerWallet).approvePlugin(paymentEventPlugin.address)
  return {
    router,
    configuration,
    ownerWallet,
    otherWallet,
    paymentPlugin,
    paymentEventPlugin,
  }
}
