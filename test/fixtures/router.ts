import { 
  deployContract,
} from 'ethereum-waffle'

import {
  ownerWallet,
  otherWallet,
} from '../utils'

import DePayRouterV1 from '../../artifacts/contracts/DePayRouterV1.sol/DePayRouterV1.json'
import DePayRouterV1Configuration from '../../artifacts/contracts/DePayRouterV1Configuration.sol/DePayRouterV1Configuration.json'

export async function routerFixture() {  
  const configuration = await deployContract(ownerWallet, DePayRouterV1Configuration)
  const router = await deployContract(ownerWallet, DePayRouterV1, [configuration.address])
  return {
    router,
    configuration,
    ownerWallet,
    otherWallet
  }
}
