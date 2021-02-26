import chai, { expect } from 'chai'

import {
  Contract,
  providers,
  BigNumber,
  Wallet 
} from 'ethers'

import { 
  solidity,
  deployContract,
  deployMockContract,
  loadFixture,
  MockProvider
} from 'ethereum-waffle'

import {
  paymentAndTestTokenFixture,
  paymentEventFixture,
  paymentFixture,
  routerFixture,
  unapprovedUniswapFixture,
  uniswapFixture,
  uniswapPairAndCallContractFixture,
  uniswapPairFixture,
} from './shared/fixtures'

import DePayRouterV1 from '../artifacts/contracts/DePayRouterV1.sol/DePayRouterV1.json'
import DePayRouterV1ApproveAndCallContractAddressAmount01 from '../artifacts/contracts/DePayRouterV1ApproveAndCallContractAddressAmount01.sol/DePayRouterV1ApproveAndCallContractAddressAmount01.json'
import DePayRouterV1Configuration from '../artifacts/contracts/DePayRouterV1Configuration.sol/DePayRouterV1Configuration.json'
import DePayRouterV1Payment01 from '../artifacts/contracts/DePayRouterV1Payment01.sol/DePayRouterV1Payment01.json'
import DePayRouterV1PaymentEvent01 from '../artifacts/contracts/DePayRouterV1PaymentEvent01.sol/DePayRouterV1PaymentEvent01.json'
import DePayRouterV1Uniswap01 from '../artifacts/contracts/DePayRouterV1Uniswap01.sol/DePayRouterV1Uniswap01.json'
import IDePayRouterV1 from '../artifacts/contracts/interfaces/IDePayRouterV1.sol/IDePayRouterV1.json'
import IDePayRouterV1Plugin from '../artifacts/contracts/interfaces/IDePayRouterV1Plugin.sol/IDePayRouterV1Plugin.json'
import IERC20 from '../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json'
import StakingPool from '../artifacts/contracts/test/StakingPool.sol/StakingPool.json'
import TestToken from '../artifacts/contracts/test/TestToken.sol/TestToken.json'
import UniswapV2Factory from '../artifacts/contracts/test/UniswapV2Factory.sol/UniswapV2Factory.json'
import UniswapV2Pair from '../artifacts/contracts/test/UniswapV2Pair.sol/UniswapV2Pair.json'
import UniswapV2Router02 from '../artifacts/contracts/test/UniswapV2Router02.sol/UniswapV2Router02.json'
import WETH9 from '../artifacts/contracts/test/WETH9.sol/WETH9.json'
import {route} from './shared/functions'

const { ethers } = require("hardhat")

const ETH = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
const MAXINT = BigNumber.from("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")

chai.use(solidity)

let now = () => Math.round(new Date().getTime() / 1000)

describe('DePayRouterV1', () => {

  interface deployAndApprovePaymentParameters {
    configuration: Contract,
    wallet: Wallet
  }

  async function deployAndApprovePayment({
    configuration,
    wallet
  }: deployAndApprovePaymentParameters) {
    const PaymentContract = await deployContract(wallet, DePayRouterV1Payment01)
    await configuration.connect(wallet).approvePlugin(PaymentContract.address)
    return { PaymentContract }
  }

  interface deployAndApprovePaymentEventParameters {
    configuration: Contract,
    wallet: Wallet
  }

  async function deployAndApprovePaymentEvent({
    configuration,
    wallet
  }: deployAndApprovePaymentEventParameters) {
    const PaymentEventContract = await deployContract(wallet, DePayRouterV1PaymentEvent01)
    await configuration.connect(wallet).approvePlugin(PaymentEventContract.address)
    return { PaymentEventContract }
  }

  interface deployAndApproveUniswapParameters {
    configuration: Contract,
    wallet: Wallet,
    WETH: Contract,
    uniswapRouter: Contract
  }

  async function deployAndApproveUniswap({
    configuration,
    wallet,
    WETH,
    uniswapRouter
  }: deployAndApproveUniswapParameters) {
    const UniswapContract = await deployContract(wallet, DePayRouterV1Uniswap01, [WETH.address, uniswapRouter.address])
    await configuration.connect(wallet).approvePlugin(UniswapContract.address)
    return { UniswapContract }
  }

  interface deployAndApproveContractCallPluginParameters {
    configuration: Contract,
    wallet: Wallet
  }

  async function deployAndApproveContractCallPlugin({
    configuration,
    wallet
  }: deployAndApproveContractCallPluginParameters) {
    const contractCallPluginContract = await deployContract(wallet, DePayRouterV1ApproveAndCallContractAddressAmount01)
    await configuration.connect(wallet).approvePlugin(contractCallPluginContract.address)
    return { contractCallPluginContract }
  }

  interface deployWETHParameters {
    wallet: Wallet,
  }

  async function deployWETH({
    wallet
  }: deployWETHParameters) {
    const WETH = await deployContract(wallet, WETH9)
    return { WETH }
  }

  interface deployStakingPoolParameters {
    wallet: Wallet,
    token: string
  }

  async function deployStakingPool({
    wallet,
    token
  }: deployStakingPoolParameters) {
    const stakingPoolContract = await deployContract(wallet, StakingPool)
    await stakingPoolContract.initialize(token)
    
    return {
      stakingPoolContract
    }
  }

  interface deployUniswapParameters {
    WETH: Contract,
    wallet: Wallet
  }

  async function deployUniswap({
    WETH,
    wallet
  }: deployUniswapParameters) {
    const uniswapFactory = await deployContract(wallet, UniswapV2Factory, [wallet.address])
    const uniswapRouter = await deployContract(wallet, UniswapV2Router02, [uniswapFactory.address, WETH.address])
    
    return {
      uniswapFactory,
      uniswapRouter
    }
  }

  interface createUniswapPairParameters {
    token0: Contract,
    token1: Contract,
    WETH: Contract,
    router: Contract,
    wallet: Wallet,
    uniswapFactory: Contract
  }

  async function createUniswapPair({
    token0,
    token1,
    WETH,
    router,
    wallet,
    uniswapFactory
  }: createUniswapPairParameters) {
    if(token0 != WETH) {
      await token0.connect(wallet).transfer(wallet.address, 1000000)
      await token0.connect(wallet).approve(router.address, MAXINT)
    }
    
    if(token1 == WETH) { throw 'token1 is not allowed to be WETH, use token0 instead!' }
    await token1.connect(wallet).transfer(wallet.address, 1000000)
    await token1.connect(wallet).approve(router.address, MAXINT)

    await uniswapFactory.createPair(token0.address, token1.address)
    const pairAddress = await uniswapFactory.getPair(token0.address, token1.address)
    
    if(token0 == WETH) {
      await router.connect(wallet).addLiquidityETH(
        token1.address,
        1000000,
        1000000,
        1000000,
        wallet.address,
        MAXINT,
        {value: 1000000}
      )
    } else {
      await router.connect(wallet).addLiquidity(
        token0.address,
        token1.address,
        1000000,
        1000000,
        1000000,
        1000000,
        wallet.address,
        MAXINT
      )
    }

    return pairAddress
  }

  it('deploys router successfully', async () => {
    await loadFixture(routerFixture)
  })

  it('makes sure DePayRouterV1 has the same interface as IDePayRouterV1', async () => {
    const {router, ownerWallet} = await loadFixture(routerFixture)
    
    const interfaceContract = await deployMockContract(ownerWallet, IDePayRouterV1.abi)
    let inheritedFragmentNames: string[] = ['OwnershipTransferred', 'transferOwnership', 'owner', 'renounceOwnership']
    let contractFragmentsFiltered = router.interface.fragments.filter(
      function(fragment){
        return inheritedFragmentNames.indexOf(fragment.name) < 0 &&
          fragment.type != 'constructor'
      } 
    )
    expect(
      JSON.stringify(contractFragmentsFiltered)
    ).to.eq(
      JSON.stringify(interfaceContract.interface.fragments)
    )
  })

  it('sets deployer wallet as the contract owner', async () => {
    const {configuration, ownerWallet} = await loadFixture(routerFixture)

    const owner = await configuration.owner()
    expect(owner).to.equal(ownerWallet.address)
  })

  it('can receive ETH, which is required for ETH transfers and swapping', async () => {
    const {router, otherWallet} = await loadFixture(routerFixture)

    await expect(
      await otherWallet.sendTransaction({ to: router.address, value: 1000, gasPrice: 0 })
    ).to.changeEtherBalance(router, 1000)
  })

  it('allows to perform simple ETH payments without conversion', async () => {
    const {router, ownerWallet, otherWallet, paymentPlugin} = await loadFixture(paymentFixture)
    
    await expect(
      await route({
        router,
        wallet: ownerWallet,
        path: [ETH],
        amounts: [1000, 1000],
        addresses: [ownerWallet.address, otherWallet.address],
        plugins: [paymentPlugin.address],
        value: 1000
      })
    ).to.changeEtherBalance(otherWallet, 1000)
  })

  it('emits a Payment event if requested via plugin', async () => {
    const {router, ownerWallet, otherWallet, paymentPlugin, paymentEventPlugin} = await loadFixture(paymentEventFixture)
    
    await expect(
      route({
        router,
        wallet: ownerWallet,
        path: [ETH],
        amounts: [1000, 1000],
        addresses: [ownerWallet.address, otherWallet.address],
        plugins: [paymentPlugin.address, paymentEventPlugin.address],
        value: 1000
      })
    ).to.emit(paymentEventPlugin, 'Payment')
    .withArgs(
      ownerWallet.address,
      otherWallet.address
    );
  })

  it('fails if the sent ETH value is to low to forward eth to the receiver', async () => {
    const {router, ownerWallet, otherWallet} = await loadFixture(routerFixture)
    
    await expect(
      route({
        router,
        wallet: ownerWallet,
        path: [ETH],
        amounts: [1000, 1000],
        addresses: [otherWallet.address],
        plugins: [router.address],
        value: 999
      })
    ).to.be.revertedWith(
      'VM Exception while processing transaction: revert DePay: Insufficient ETH amount payed in!'
    )
  })

  it('allows for direct token transfers without performing any conversion', async () => {
    const {router, ownerWallet, otherWallet, paymentPlugin, testTokenContract} = await loadFixture(paymentAndTestTokenFixture)    
    
    await testTokenContract.connect(ownerWallet).approve(router.address, 1000)
    await expect(() => 
      route({
        router,
        wallet: ownerWallet,
        path: [testTokenContract.address],
        amounts: [1000, 1000],
        addresses: [otherWallet.address],
        plugins: [paymentPlugin.address]
      })
    ).to.changeTokenBalance(testTokenContract, otherWallet, 1000)
  })

  it('allows the contract owner to add plugins', async () => {
    const {router, otherWallet, uniswapPlugin} = await loadFixture(uniswapFixture)

    expect(await router.isApproved(uniswapPlugin.address)).to.eq(true)
    expect(await router.isApproved(otherWallet.address)).to.eq(false)
  })

  it('emits PluginApproved when approving new plugins', async () => {
    const {configuration, uniswapPlugin} = await loadFixture(uniswapFixture)

    await expect(
      configuration.approvePlugin(uniswapPlugin.address)
    ).to.emit(configuration, 'PluginApproved')
    .withArgs(
      uniswapPlugin.address
    );
  })

  it('does NOT allow others to add plugins', async () => {
    const {configuration, otherWallet, uniswapPlugin} = await loadFixture(uniswapFixture)

    await expect(
      configuration.connect(otherWallet).approvePlugin(uniswapPlugin.address)
    ).to.be.revertedWith(
      'VM Exception while processing transaction: revert Ownable: caller is not the owner'
    )
  })

  it('fails when trying to use a plugin that is not approved', async () => {
    const {router, ownerWallet, otherWallet, uniswapPlugin} = await loadFixture(unapprovedUniswapFixture)
    
    await expect(
      route({
        router,
        wallet: ownerWallet,
        path: [ETH],
        amounts: [1000, 1000],
        addresses: [otherWallet.address],
        plugins: [otherWallet.address],
        value: 1000
      })
    ).to.be.revertedWith(
      'VM Exception while processing transaction: revert DePay: Plugin not approved'
    )
  })

  it('swaps tokens via uniswap before performing a payment', async () => {
    const {
      otherWallet,
      ownerWallet,
      paymentPlugin,
      router,
      token0,
      token1,
      uniswapPlugin,
      uniswapRouter,
      WETH,
    } = await loadFixture(uniswapPairFixture)

    let path = [token0.address, WETH.address, token1.address]
    let amountOut = 1000
    let amounts = await uniswapRouter.getAmountsIn(amountOut, path)
    let amountIn = amounts[0].toNumber()

    await expect(() => 
      route({
        router,
        wallet: ownerWallet,
        path: path,
        amounts: [
          amountIn,
          amountOut,
          now()+10000 // deadline
        ],
        addresses: [otherWallet.address],
        plugins: [uniswapPlugin.address, paymentPlugin.address]
      })
    ).to.changeTokenBalance(token1, otherWallet, 1000)
  })

  it('fails when a miner withholds a swap and executes the payment transaction after the deadline has been reached', async () => {
    const {
      otherWallet,
      ownerWallet,
      paymentPlugin,
      router,
      token0,
      token1,
      uniswapPlugin,
      uniswapRouter,
      WETH,
    } = await loadFixture(uniswapPairFixture)

    let path = [token0.address, WETH.address, token1.address]
    let amountOut = 1000
    let amounts = await uniswapRouter.getAmountsIn(amountOut, path)
    let amountIn = amounts[0].toNumber()

    await expect(
      route({
        router,
        wallet: ownerWallet,
        path: path,
        amounts: [
          amountIn,
          amountOut,
          now() - 1000 // deadline in the past
        ],
        addresses: [otherWallet.address],
        plugins: [uniswapPlugin.address, paymentPlugin.address]
      })
    ).to.be.revertedWith(
      'UniswapV2Router: EXPIRED'
    )
  })

  it('swaps ETH to token via uniswap before performing a payment', async () => {
    const {
      otherWallet,
      ownerWallet,
      paymentPlugin,
      router,
      token0,
      uniswapPlugin,
      uniswapRouter,
      WETH,
    } = await loadFixture(uniswapPairFixture)

    let amountOut = 1000
    let amounts = await uniswapRouter.getAmountsIn(amountOut, [WETH.address, token0.address])
    let amountIn = amounts[0].toNumber()

    await expect(() => 
      route({
        router,
        wallet: ownerWallet,
        path: [ETH, token0.address],
        amounts: [
          amountIn,
          amountOut,
          now()+10000 // deadline
        ],
        addresses: [otherWallet.address],
        plugins: [uniswapPlugin.address, paymentPlugin.address],
        value: amountIn
      })
    ).to.changeTokenBalance(token0, otherWallet, amountOut)
  })

  it('swaps tokens for ETH via uniswap before performing a payment', async () => {
    const {
      otherWallet,
      ownerWallet,
      paymentPlugin,
      router,
      token0,
      uniswapPlugin,
      uniswapRouter,
      WETH,
    } = await loadFixture(uniswapPairFixture)

    let amountOut = 1000
    let amounts = await uniswapRouter.getAmountsIn(amountOut, [token0.address, WETH.address])
    let amountIn = amounts[0].toNumber()

    await expect(() => 
      route({
        router,
        wallet: ownerWallet,
        path: [token0.address, ETH],
        amounts: [
          amountIn,
          amountOut,
          now()+10000 // deadline
        ],
        addresses: [otherWallet.address],
        plugins: [uniswapPlugin.address, paymentPlugin.address],
        value: amountIn
      })
    ).to.changeEtherBalance(otherWallet, amountOut)
  })

  it('swaps tokens to tokens via uniswap and pays the resulting tokens into a contract', async () => {
    const {
      contractCallPlugin,
      exampleContract,
      ownerWallet,
      paymentPlugin,
      router,
      token0,
      token1,
      uniswapPlugin,
      uniswapRouter,
      WETH,
    } = await loadFixture(uniswapPairAndCallContractFixture)

    let path = [token0.address, WETH.address, token1.address]
    let amountOut = 1000
    let amounts = await uniswapRouter.getAmountsIn(amountOut, path)
    let amountIn = amounts[0].toNumber()

    await expect(
      route({
        router,
        wallet: ownerWallet,
        path: path,
        amounts: [
          amountIn,
          amountOut,
          now()+10000 // deadline
        ],
        addresses: [ownerWallet.address, exampleContract.address],
        data: ["depositFor(address,uint256)"],
        plugins: [uniswapPlugin.address, contractCallPlugin.address]
      })
    ).to.emit(exampleContract, 'Deposit')
    .withArgs(
      ownerWallet.address,
      amountOut
    )
  })

  it('makes sure that the eth balance in the smart contract is >= after the payment compared to before', async () => {
    const {router, ownerWallet, otherWallet, paymentPlugin, token0, uniswapRouter, WETH} = await loadFixture(uniswapPairFixture)

    let amountOut = 1000
    let amounts = await uniswapRouter.getAmountsIn(amountOut, [token0.address, WETH.address])
    let amountIn = amounts[0].toNumber()

    await ownerWallet.sendTransaction({to: router.address, value: 1000})

    await expect(
      route({
        router,
        wallet: ownerWallet,
        path: [token0.address, ETH],
        amounts: [
          amountIn,
          amountOut,
          now()+10000 // deadline
        ],
        addresses: [otherWallet.address],
        plugins: [paymentPlugin.address]
      })
    ).to.be.revertedWith(
      'VM Exception while processing transaction: revert DePay: Insufficient balance after payment!'
    )
  })

  it('makes sure that the token balance in the smart contract is >= after the payment compared to before', async () => {
    const {router, ownerWallet, otherWallet, paymentPlugin, token0, uniswapRouter, WETH} = await loadFixture(uniswapPairFixture)

    let amountOut = 1000
    let amounts = await uniswapRouter.getAmountsIn(amountOut, [WETH.address, token0.address])
    let amountIn = amounts[0].toNumber()

    await token0.connect(ownerWallet).transfer(router.address, 5000)

    await expect(
      route({
        router,
        wallet: ownerWallet,
        path: [ETH, token0.address],
        amounts: [
          amountIn,
          amountOut,
          now()+10000
        ],
        addresses: [otherWallet.address],
        plugins: [paymentPlugin.address],
        value: amountIn
      })    
    ).to.be.revertedWith(
      'VM Exception while processing transaction: revert DePay: Insufficient balance after payment!'
    )
  })

  it('allows owner to withdraw ETH that remained in the contract', async () => {
    const {router, ownerWallet, otherWallet} = await loadFixture(routerFixture)
    await otherWallet.sendTransaction({ to: router.address, value: 1000, gasPrice: 0 })
    
    await expect(
      await router.connect(ownerWallet).withdraw(ETH, 1000)
    ).to.changeEtherBalance(ownerWallet, 1000)
  })

  it('does not allow others to withdraw ETH that remained in the contract', async () => {
    const {router, ownerWallet, otherWallet} = await loadFixture(routerFixture)
    await otherWallet.sendTransaction({ to: router.address, value: 1000, gasPrice: 0 })
    
    await expect(
      router.connect(otherWallet).withdraw(ETH, 1000)
    ).to.be.revertedWith(
      'VM Exception while processing transaction: revert Ownable: caller is not the owner'
    )
  })

  it('allows owner to withdraw tokens that remained in the contract', async () => {
    const {router, ownerWallet, otherWallet} = await loadFixture(routerFixture)
    const testTokenContract = await deployContract(otherWallet, TestToken)
    await testTokenContract.transfer(router.address, 1000)

    await expect(() => 
      router.connect(ownerWallet).withdraw(testTokenContract.address, 1000)
    ).to.changeTokenBalance(testTokenContract, ownerWallet, 1000)
  })

  it('does not allow others to withdraw tokens that remained in the contract', async () => {
    const {router, ownerWallet, otherWallet} = await loadFixture(routerFixture)
    const testTokenContract = await deployContract(otherWallet, TestToken)
    await testTokenContract.transfer(router.address, 1000)

    await expect(
      router.connect(otherWallet).withdraw(testTokenContract.address, 1000)
    ).to.be.revertedWith(
      'VM Exception while processing transaction: revert Ownable: caller is not the owner'
    )
  })
})
