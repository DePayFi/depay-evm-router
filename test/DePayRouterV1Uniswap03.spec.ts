import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'
import { contractDeploy, getContractByNameAddAddress } from './helpers/network-context'
import { DePayRouterV1Uniswap03 } from '../typechain/DePayRouterV1Uniswap03'
import { IUniswapV3Router03 } from '../typechain/IUniswapV3Router03'
import { autoLoad, IAutoLoadResult } from './helpers/auto-load'
import { BigNumber } from '@ethersproject/bignumber'
import { MAXINT, now } from './utils'
import hre from 'hardhat'

chai.use(solidity)

let depayUniswap03: DePayRouterV1Uniswap03, context: IAutoLoadResult

describe('DePayRouterV1 + DePayRouterV1Uniswap03', function() {
  // Upgrade for coverage
  this.timeout(500000)

  it('all context should be loaded correctly', async () => {
    context = await autoLoad()
  })

  it('should able to deploy 1inch swap plugin on mainnet forking', async () => {
    depayUniswap03 = <DePayRouterV1Uniswap03>(
      await contractDeploy(
        context.ownerWallet,
        'DePayRouterV1Uniswap03',
        context.mainnet.WETH,
        context.mainnet.UniSwapRouter
      )
    )
  })

  it('should able to unlock DePayRouterV1Owner wallet and approve plugin', async () => {
    await context.depayRouterV1Configuration.connect(context.depayRouterV1Owner).approvePlugin(depayUniswap03.address)
    expect(await context.depayRouterV1.isApproved(depayUniswap03.address)).to.eq(true)
  })

  it('Should able to swap ETH for DAI', async () => {
    const unit = BigNumber.from(10).pow(18)
    const inAmount = unit;
    const beforeDAIBalance = await context.tokenDAI.balanceOf(context.depayRouterV1.address)
    await context.tokenWETH.connect(context.ownerWallet).approve(context.depayRouterV1.address, MAXINT)
    await context.depayRouterV1.connect(context.ownerWallet).route(
      [context.mainnet.ETH, context.mainnet.DAI],
      [
        inAmount,
        0,
        // We do data packing here
        BigNumber.from('0x0000000000000000000000000000000000000000000000000000000000000bb8'),
        now() + 100000
      ],
      [],
      [depayUniswap03.address],
      [],
      {
        value: inAmount
      }
    )
    const afterDAIBalance = await context.tokenDAI.balanceOf(context.depayRouterV1.address)
    // DAI balance must be increased
    expect(afterDAIBalance.sub(beforeDAIBalance).gt(0)).to.eq(true)
  })

  it('swap token via UniSwap plugin before perform payment', async () => {
    const unit = BigNumber.from(10).pow(18)
    const inAmount = unit;
    const ownerWalletAddress = await context.ownerWallet.getAddress()
    const beforeDAIBalance = await context.tokenDAI.balanceOf(ownerWalletAddress)
    
    await context.tokenWETH.connect(context.ownerWallet).approve(context.depayRouterV1.address, MAXINT)
    await context.depayRouterV1.connect(context.ownerWallet).route(
      [context.mainnet.ETH, context.mainnet.DAI],
      [
        inAmount,
        unit.mul(100),
        // We do data packing here
        BigNumber.from('0x0000000000000000000000000000000000000000000000000000000000000bb8'),
        now() + 100000
      ],
      [ownerWalletAddress],
      [depayUniswap03.address, context.mainnet.DePayRouterV1Payment01],
      [],
      {
        value: inAmount
      }
    )
    const balanceOf = await  context.tokenDAI.balanceOf(context.depayRouterV1.address)
    const afterDAIBalance = await context.tokenDAI.balanceOf(ownerWalletAddress)
    // DAI balance must be increased
    expect(afterDAIBalance.sub(beforeDAIBalance).gt(0)).to.eq(true)
  })

  it('should able to 1 DAI for ETH', async () => {
    const unit = BigNumber.from(10).pow(18)
    const inAmount = unit;
    const beforeETHBalance = await hre.ethers.provider.getBalance(context.depayRouterV1.address)
    await context.tokenDAI.connect(context.ownerWallet).approve(context.depayRouterV1.address, MAXINT)
    await context.depayRouterV1.connect(context.ownerWallet).route(
      [context.mainnet.DAI, context.mainnet.ETH],
      [
        inAmount,
        0,
        // We do data packing here, fee could be 0xbb8 or 0x2710
        BigNumber.from('0x0000000000000000000000000000000000000000000000000000000000000bb8'),
        now() + 100000
      ],
      [],
      [depayUniswap03.address],
      []
    )
    const afterETHBalance = await hre.ethers.provider.getBalance(context.depayRouterV1.address)
    // DAI balance must be increased
    expect(afterETHBalance.sub(beforeETHBalance).gt(0)).to.eq(true)
  })
})
