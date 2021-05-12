import hre from 'hardhat'
import {
  IMainnetContext,
  initContext,
  unlockSigner,
  getContractByName,
  getContractByNameAddAddress
} from './network-context'

import { DePayRouterV1Configuration } from '../../typechain/DePayRouterV1Configuration'
import { DePayRouterV1 } from '../../typechain/DePayRouterV1'
import { WETH9 } from '../../typechain/WETH9'
import { ERC20 } from '../../typechain/ERC20'
import { Signer } from '@ethersproject/abstract-signer'
import { ETH } from '../utils'

export interface IAutoLoadResult {
  mainnet: IMainnetContext
  // Signers
  fakeETHAddress: Signer
  depayRouterV1Owner: Signer
  ownerWallet: Signer
  otherWallet: Signer
  // Tokens
  tokenWETH: WETH9
  tokenDAI: ERC20
  // DePay contracts need to preload
  depayRouterV1: DePayRouterV1
  depayRouterV1Configuration: DePayRouterV1Configuration
}

let context: any = {}
export async function autoLoad(): Promise<IAutoLoadResult> {
  if (!context.mainnet) {
    context.mainnet = <IMainnetContext>await initContext()
  }

  if (!context.ownerWallet || context.otherWallet.otherWallet) {
    let [ownerWallet, otherWallet] = await hre.ethers.getSigners()
    context.ownerWallet = ownerWallet
    context.otherWallet = otherWallet
  }

  if (!context.tokenWETH) {
    context.tokenWETH = <WETH9>await getContractByNameAddAddress('WETH9', context.mainnet.WETH)
  }

  if (!context.tokenDAI) {
    context.tokenDAI = <ERC20>await getContractByNameAddAddress('ERC20', context.mainnet.DAI)
  }

  if (!context.depayRouterV1Owner) {
    context.depayRouterV1Owner = await unlockSigner('DePayRouterV1Owner', context.mainnet.DePayRouterV1Owner)
  }

  if (!context.depayRouterV1Configuration) {
    context.depayRouterV1Configuration = <DePayRouterV1Configuration>(
      await getContractByName('DePayRouterV1Configuration')
    )
  }
  if (!context.depayRouterV1) {
    context.depayRouterV1 = <DePayRouterV1>await getContractByName('DePayRouterV1')
  }
  if (!context.fakeETHAddress) {
    context.fakeETHAddress = await unlockSigner('fakeETHAddress', ETH)
  }
  return context
}
