import chai, { expect } from 'chai'
import hre from 'hardhat'
import {
  contractDeploy,
  IMainnetContext,
  initContext,
  unlockSigner,
  getContractByName
} from './helpers/network-context'

import { solidity } from 'ethereum-waffle'
import { DePayRouterV1Configuration } from '../typechain/DePayRouterV1Configuration'
import { DePayRouterV1OneInchSwap } from '../typechain/DePayRouterV1OneInchSwap'
import { DePayRouterV1 } from '../typechain/DePayRouterV1'
import { Signer } from '@ethersproject/abstract-signer'

chai.use(solidity)

let depayOneInchSwap: DePayRouterV1OneInchSwap,
  depayRouterV1Configuration: DePayRouterV1Configuration,
  depayRouterV1Owner: Signer,
  depayRouterV1: DePayRouterV1,
  networkContext: IMainnetContext,
  ownerWallet: Signer

describe('DePayRouterV1 + DePayRouterV1OneInchSwap', () => {
  it('all context should be loaded correctly', async () => {
    networkContext = <IMainnetContext>await initContext()
    ;[ownerWallet] = await hre.ethers.getSigners()
    
    depayRouterV1Owner = await unlockSigner('DePayRouterV1Owner', networkContext.DePayRouterV1Owner)
    depayRouterV1Configuration = <DePayRouterV1Configuration>await getContractByName('DePayRouterV1Configuration')
    depayRouterV1 = <DePayRouterV1>await getContractByName('DePayRouterV1')
  })

  it('should able to deploy 1inch swap plugin on mainnet forking', async () => {
    depayOneInchSwap = <DePayRouterV1OneInchSwap>(
      await contractDeploy(ownerWallet, 'DePayRouterV1OneInchSwap', networkContext.OneSplitAudit)
    )
  })

  it('should able to unlock DePayRouterV1Owner wallet and approve plugin', async () => {
    await depayRouterV1Configuration.connect(depayRouterV1Owner).approvePlugin(depayOneInchSwap.address)
    expect(await depayRouterV1.isApproved(depayOneInchSwap.address)).to.eq(true)
  })
})
