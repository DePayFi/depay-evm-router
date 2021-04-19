import chai, { expect } from 'chai'
import hre, { ethers } from 'hardhat'
import {
  contractDeploy,
  IMainnetContext,
  initContext,
  unlockSigner,
  getContractByName,
  getContractByNameAddAddress
} from './helpers/network-context'

import { solidity } from 'ethereum-waffle'
import { DePayRouterV1Configuration } from '../typechain/DePayRouterV1Configuration'
import { DePayRouterV1OneInchSwap01 } from '../typechain/DePayRouterV1OneInchSwap01'
import { DePayRouterV1 } from '../typechain/DePayRouterV1'
import { IOneSplitAudit } from '../typechain/IOneSplitAudit'
import { ERC20 } from '../typechain/ERC20'
import { Signer } from '@ethersproject/abstract-signer'
import { ETH, MAXINT } from './utils'
import { BigNumber } from '@ethersproject/bignumber'

chai.use(solidity)

let depayOneInchSwap01: DePayRouterV1OneInchSwap01,
  depayRouterV1Configuration: DePayRouterV1Configuration,
  depayRouterV1Owner: Signer,
  depayRouterV1: DePayRouterV1,
  networkContext: IMainnetContext,
  ownerWallet: Signer,
  otherWallet: Signer,
  fakeETHAddress: Signer,
  oneSplitAudit: IOneSplitAudit,
  tokenWETH: ERC20,
  tokenDAI: ERC20

describe('DePayRouterV1 + DePayRouterV1OneInchSwap01', () => {
  it('all context should be loaded correctly', async () => {
    networkContext = <IMainnetContext>await initContext()
    ;[ownerWallet, otherWallet] = await hre.ethers.getSigners()
    tokenWETH = <ERC20>await getContractByNameAddAddress('ERC20', networkContext.tokenWETH)
    tokenDAI = <ERC20>await getContractByNameAddAddress('ERC20', networkContext.DAI)
    depayRouterV1Owner = await unlockSigner('DePayRouterV1Owner', networkContext.DePayRouterV1Owner)
    depayRouterV1Configuration = <DePayRouterV1Configuration>await getContractByName('DePayRouterV1Configuration')
    oneSplitAudit = <IOneSplitAudit>await getContractByNameAddAddress('IOneSplitAudit', networkContext.OneSplitAudit)
    depayRouterV1 = <DePayRouterV1>await getContractByName('DePayRouterV1')
    fakeETHAddress = await unlockSigner('fakeETHAddress', ETH)
  })

  it('should able to deploy 1inch swap plugin on mainnet forking', async () => {
    depayOneInchSwap01 = <DePayRouterV1OneInchSwap01>(
      await contractDeploy(ownerWallet, 'DePayRouterV1OneInchSwap01', networkContext.OneSplitAudit)
    )
  })

  it('should able to unlock DePayRouterV1Owner wallet and approve plugin', async () => {
    await depayRouterV1Configuration.connect(depayRouterV1Owner).approvePlugin(depayOneInchSwap01.address)
    expect(await depayRouterV1.isApproved(depayOneInchSwap01.address)).to.eq(true)
  })

  it('should able to get swap ETH for DAI', async () => {
    const unit = BigNumber.from(10).pow(18)
    const inAmount = unit.div(100)
    const { returnAmount, distribution } = await oneSplitAudit.getExpectedReturn(
      ETH,
      networkContext.DAI,
      inAmount,
      100,
      0
    )
    // expected return should be calculated -3%
    const expectedReturn = returnAmount.sub(returnAmount.div(100).mul(3))
    const beforeDAIBalance = await tokenDAI.balanceOf(depayRouterV1.address)
    await tokenWETH.connect(ownerWallet).approve(depayRouterV1.address, MAXINT)
    await depayRouterV1
      .connect(ownerWallet)
      .route(
        [ETH, tokenDAI.address],
        [inAmount, expectedReturn, 0, ...distribution],
        [],
        [depayOneInchSwap01.address],
        [],
        {
          value: inAmount
        }
      )
    const afterDAIBalance = await tokenDAI.balanceOf(depayRouterV1.address)
    expect(afterDAIBalance.sub(beforeDAIBalance).gte(expectedReturn)).to.eq(true)
  })

  it('should able to swap 1 DAI token for ETH', async () => {
    const unit = BigNumber.from(10)
      .pow(18)
      .div(1000)
    const inAmount = unit
    const { returnAmount, distribution } = await oneSplitAudit.getExpectedReturn(
      networkContext.DAI,
      ETH,
      inAmount,
      100,
      0
    )

    // expected return should be calculated -3%
    const expectedReturn = returnAmount.sub(returnAmount.div(100).mul(3))
    const beforeETHBalance = await hre.ethers.provider.getBalance(depayRouterV1.address)
    // Transfer 10 DAI from fakeETHAddress to ownerWallet
    await tokenDAI.connect(fakeETHAddress).transfer(await ownerWallet.getAddress(), inAmount)
    await tokenDAI.connect(ownerWallet).approve(depayRouterV1.address, MAXINT)

    await depayRouterV1
      .connect(ownerWallet)
      .route(
        [tokenDAI.address, ETH],
        [inAmount, expectedReturn, 0, ...distribution],
        [],
        [depayOneInchSwap01.address],
        []
      )
    const afterETHBalance = await hre.ethers.provider.getBalance(depayRouterV1.address)
    expect(afterETHBalance.sub(beforeETHBalance).gte(expectedReturn)).to.eq(true)
  })

  it('Swap token via OneInchSwap plugin before perform payment', async () => {
    const unit = BigNumber.from(10).pow(18)
    const inAmount = unit.div(100)
    const otherWalletAddress = await otherWallet.getAddress();
    const { returnAmount, distribution } = await oneSplitAudit.getExpectedReturn(
      ETH,
      networkContext.DAI,
      inAmount,
      100,
      0
    )
    // expected return should be calculated -3%
    const expectedReturn = returnAmount.sub(returnAmount.div(100).mul(3))
    const beforeDAIBalance = await tokenDAI.balanceOf(otherWalletAddress)
    await tokenWETH.connect(ownerWallet).approve(depayRouterV1.address, MAXINT)
    await depayRouterV1
      .connect(ownerWallet)
      .route(
        [ETH, tokenDAI.address],
        [inAmount, expectedReturn, 0, ...distribution],
        [otherWalletAddress],
        [depayOneInchSwap01.address, networkContext.DePayRouterV1Payment01],
        [],
        {
          value: inAmount
        }
      )
    const afterDAIBalance = await tokenDAI.balanceOf(otherWalletAddress)
    expect(afterDAIBalance.sub(beforeDAIBalance).gte(expectedReturn)).to.eq(true)
  })
})
