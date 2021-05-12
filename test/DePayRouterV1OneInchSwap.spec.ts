import chai, { expect } from 'chai'
import hre from 'hardhat'
import { contractDeploy, getContractByNameAddAddress } from './helpers/network-context'

import { solidity } from 'ethereum-waffle'
import { DePayRouterV1OneInchSwap01 } from '../typechain/DePayRouterV1OneInchSwap01'
import { IOneSplitAudit } from '../typechain/IOneSplitAudit'
import { ETH, MAXINT, ownerWallet } from './utils'
import { BigNumber } from '@ethersproject/bignumber'
import { autoLoad, IAutoLoadResult } from './helpers/auto-load'

chai.use(solidity)

let depayOneInchSwap01: DePayRouterV1OneInchSwap01, oneSplitAudit: IOneSplitAudit, context: IAutoLoadResult

describe('DePayRouterV1 + DePayRouterV1OneInchSwap01', function() {
  // Upgrade for coverage
  this.timeout(500000)

  it('all context should be loaded correctly', async () => {
    context = await autoLoad()
    oneSplitAudit = <IOneSplitAudit>await getContractByNameAddAddress('IOneSplitAudit', context.mainnet.OneSplitAudit)
  })

  it('should able to deploy 1inch swap plugin on mainnet forking', async () => {
    depayOneInchSwap01 = <DePayRouterV1OneInchSwap01>(
      await contractDeploy(context.ownerWallet, 'DePayRouterV1OneInchSwap01', context.mainnet.OneSplitAudit)
    )
  })

  it('should able to unlock DePayRouterV1Owner wallet and approve plugin', async () => {
    await context.depayRouterV1Configuration
      .connect(context.depayRouterV1Owner)
      .approvePlugin(depayOneInchSwap01.address)
    expect(await context.depayRouterV1.isApproved(depayOneInchSwap01.address)).to.eq(true)
  })

  it('should able to get swap ETH for DAI', async () => {
    const unit = BigNumber.from(10).pow(18)
    const inAmount = unit
    const { returnAmount, distribution } = await oneSplitAudit.getExpectedReturn(
      ETH,
      context.mainnet.DAI,
      inAmount,
      100,
      0
    )
    // expected return should be calculated -3%
    const expectedReturn = returnAmount.sub(returnAmount.div(100).mul(3))
    const beforeDAIBalance = await context.tokenDAI.balanceOf(context.depayRouterV1.address)
    await context.tokenWETH.connect(context.ownerWallet).approve(context.depayRouterV1.address, MAXINT)
    await context.depayRouterV1
      .connect(context.ownerWallet)
      .route(
        [ETH, context.tokenDAI.address],
        [inAmount, expectedReturn, 0, ...distribution],
        [],
        [depayOneInchSwap01.address],
        [],
        {
          value: inAmount
        }
      )
    const afterDAIBalance = await context.tokenDAI.balanceOf(context.depayRouterV1.address)
    expect(afterDAIBalance.sub(beforeDAIBalance).gte(expectedReturn)).to.eq(true)
  })

  it('Swap token via OneInchSwap plugin before perform payment', async () => {
    const unit = BigNumber.from(10).pow(18)
    const inAmount = unit
    const ownerWalletAddress = await context.ownerWallet.getAddress()
    const { returnAmount, distribution } = await oneSplitAudit.getExpectedReturn(
      ETH,
      context.mainnet.DAI,
      inAmount,
      100,
      0
    )
    // expected return should be calculated -3%
    const expectedReturn = returnAmount.sub(returnAmount.div(100).mul(3))
    const beforeDAIBalance = await context.tokenDAI.balanceOf(ownerWalletAddress)
    await context.tokenWETH.connect(context.ownerWallet).approve(context.depayRouterV1.address, MAXINT)
    await context.depayRouterV1
      .connect(context.ownerWallet)
      .route(
        [ETH, context.mainnet.DAI],
        [inAmount, expectedReturn, 0, ...distribution],
        [ownerWalletAddress],
        [depayOneInchSwap01.address, context.mainnet.DePayRouterV1Payment01],
        [],
        {
          value: inAmount
        }
      )
    const afterDAIBalance = await context.tokenDAI.balanceOf(ownerWalletAddress)
    expect(afterDAIBalance.sub(beforeDAIBalance).gte(expectedReturn)).to.eq(true)
  })

  it('should able to swap 10 DAI token for ETH', async () => {
    const unit = BigNumber.from(10).pow(18)
    const inAmount = unit.mul(10)

    const { returnAmount, distribution } = await oneSplitAudit.getExpectedReturn(
      context.mainnet.DAI,
      ETH,
      inAmount,
      100,
      0
    )

    // expected return should be calculated -3%
    const expectedReturn = returnAmount.sub(returnAmount.div(100).mul(3))
    const checkAddress = context.depayRouterV1.address
    const beforeETHBalance = await hre.ethers.provider.getBalance(checkAddress)
    // Transfer 10 DAI from fakeETHAddress to ownerWallet
    await context.tokenDAI.connect(context.ownerWallet).approve(context.depayRouterV1.address, MAXINT)

    await context.depayRouterV1
      .connect(context.ownerWallet)
      .route(
        [context.tokenDAI.address, ETH],
        [inAmount, expectedReturn, 0, ...distribution],
        [],
        [depayOneInchSwap01.address],
        []
      )

    const afterETHBalance = await hre.ethers.provider.getBalance(checkAddress)
    expect(afterETHBalance.sub(beforeETHBalance).gte(expectedReturn)).to.eq(true)
  })
})
