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
import IERC20 from '../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json'
import TestToken from '../artifacts/contracts/test/TestToken.sol/TestToken.json'
import DePayPaymentProcessorV1 from '../artifacts/contracts/DePayPaymentProcessorV1.sol/DePayPaymentProcessorV1.json'
import IDePayPaymentProcessorV1 from '../artifacts/contracts/interfaces/IDePayPaymentProcessorV1.sol/IDePayPaymentProcessorV1.json'
import IDePayPaymentProcessorV1Processor from '../artifacts/contracts/interfaces/IDePayPaymentProcessorV1Processor.sol/IDePayPaymentProcessorV1Processor.json'
import UniswapV2Factory from '../artifacts/contracts/test/UniswapV2Factory.sol/UniswapV2Factory.json'
import UniswapV2Pair from '../artifacts/contracts/test/UniswapV2Pair.sol/UniswapV2Pair.json'
import UniswapV2Router02 from '../artifacts/contracts/test/UniswapV2Router02.sol/UniswapV2Router02.json'
import WETH9 from '../artifacts/contracts/test/WETH9.sol/WETH9.json'
import DePayPaymentProcessorV1Uniswap01 from '../artifacts/contracts/DePayPaymentProcessorV1Uniswap01.sol/DePayPaymentProcessorV1Uniswap01.json'

const { ethers } = require("hardhat")

const ZERO = '0x0000000000000000000000000000000000000000'
const MAXINT = BigNumber.from("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")

chai.use(solidity)

describe('DePayPaymentProcessorV1', () => {

  const provider = new MockProvider({
    ganacheOptions: {
      mnemonic: 'pay pay pay pay pay pay pay pay pay pay pay pay',
      allowUnlimitedContractSize: true // as UniswapV2Router02 is just too big
    }
  })
  
  const [ownerWallet, otherWallet] = provider.getWallets()
  
  async function fixture() {
    const contract = await deployContract(ownerWallet, DePayPaymentProcessorV1)
    return {
      contract,
      ownerWallet,
      otherWallet
    }
  }

  interface deployAndAddUniswapProcessorParameters {
    contract: Contract,
    wallet: Wallet,
    WETH: Contract,
    uniswapRouter: Contract
  }

  async function deployAndAddUniswapProcessor({
    contract,
    wallet,
    WETH,
    uniswapRouter
  }: deployAndAddUniswapProcessorParameters) {
    const processorContract = await deployContract(wallet, DePayPaymentProcessorV1Uniswap01, [WETH.address, uniswapRouter.address])
    await contract.connect(wallet).addProcessor(processorContract.address)
    return { processorContract }
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

  interface payParameters {
    contract: Contract
    wallet: Wallet,
    path: string[],
    amountIn: number,
    amountOut: number,
    receiver: string,
    value?: number,
    preProcessors?: string[],
    postProcessors?: string[]
  }

  async function pay({
    contract,
    wallet,
    path,
    amountIn,
    amountOut,
    receiver,
    value = 0,
    preProcessors = [],
    postProcessors = []
  }: payParameters) {
    return contract.connect(wallet).pay(
      path,
      amountIn,
      amountOut,
      receiver,
      preProcessors,
      postProcessors,
      { value: value }
    )
  }

  it('deploys contract successfully', async () => {
    await loadFixture(fixture)
  })

  it('has the same interface as IDePayPaymentProcessorV1', async () => {
    const { contract, ownerWallet } = await loadFixture(fixture)
    const interfaceContract = await deployMockContract(ownerWallet, IDePayPaymentProcessorV1.abi)
    let inheritedFragmentNames: string[] = ['OwnershipTransferred', 'transferOwnership', 'owner', 'renounceOwnership']
    let contractFragmentsWithoutInheritance = contract.interface.fragments.filter((fragment: any)=> inheritedFragmentNames.indexOf(fragment.name) < 0)
    expect(
      JSON.stringify(contractFragmentsWithoutInheritance)
    ).to.eq(
      JSON.stringify(interfaceContract.interface.fragments)
    )
  })

  it('sets deployer wallet as the contract owner', async () => {
    const {contract, ownerWallet} = await loadFixture(fixture)
    const owner = await contract.owner()
    expect(owner).to.equal(ownerWallet.address)
  })

  it('contract can receive ETH (required for ETH transfers and swapping)', async () => {
    const {contract, otherWallet} = await loadFixture(fixture)

    await expect(
      await otherWallet.sendTransaction({ to: contract.address, value: 1000, gasPrice: 0 })
    ).to.changeEtherBalance(contract, 1000)
  })

  it('allows to perform simple ETH payments without conversion', async () => {
    const {contract, ownerWallet, otherWallet} = await loadFixture(fixture)

    await expect(
      await pay({
        contract,
        wallet: ownerWallet,
        path: [ZERO],
        amountIn: 1000,
        amountOut: 1000,
        receiver: otherWallet.address,
        value: 1000
      })
    ).to.changeEtherBalance(otherWallet, 1000)
  })

  it('emits a Payment event', async () => {
    const {contract, ownerWallet, otherWallet} = await loadFixture(fixture)
    await expect(
      pay({
        contract,
        wallet: ownerWallet,
        path: [ZERO],
        amountIn: 1000,
        amountOut: 1000,
        receiver: otherWallet.address,
        value: 1000
      })
    ).to.emit(contract, 'Payment')
    .withArgs(
      ownerWallet.address,
      otherWallet.address
    );
  })

  it('fails if the sent ETH value is to low to forward eth to the receiver', async () => {
    const {contract, ownerWallet, otherWallet} = await loadFixture(fixture)

    await expect(
      pay({
        contract,
        wallet: ownerWallet,
        path: [ZERO],
        amountIn: 1000,
        amountOut: 1000,
        receiver: otherWallet.address,
        postProcessors: [otherWallet.address],
        value: 999
      })
    ).to.be.revertedWith(
      'VM Exception while processing transaction: revert DePay: Insufficient ETH amount payed in!'
    )
  })

  it('allows for direct token transfers without performing any conversion', async () => {
    const {contract, ownerWallet, otherWallet} = await loadFixture(fixture)
    
    const testTokenContract = await deployContract(ownerWallet, TestToken)
    await testTokenContract.connect(ownerWallet).approve(contract.address, 1000)
    
    await expect(() => 
      pay({
        contract,
        wallet: ownerWallet,
        path: [testTokenContract.address],
        amountIn: 1000,
        amountOut: 1000,
        receiver: otherWallet.address
      })
    ).to.changeTokenBalance(testTokenContract, otherWallet, 1000)
  })

  it('allows the contract owner to add payment processors', async () => {
    const {contract, ownerWallet, otherWallet} = await loadFixture(fixture)

    const {WETH} = await deployWETH({wallet: ownerWallet})
    const {uniswapRouter} = await deployUniswap({WETH, wallet: ownerWallet})

    const {processorContract} = await deployAndAddUniswapProcessor({
      contract,
      wallet: ownerWallet,
      WETH,
      uniswapRouter
    })

    expect(await contract.isWhitelisted(processorContract.address)).to.eq(true)
    expect(await contract.isWhitelisted(otherWallet.address)).to.eq(false)
  })

  it('does NOT allow others to add payment processors', async () => {
    const {contract, ownerWallet, otherWallet} = await loadFixture(fixture)
    const {WETH} = await deployWETH({wallet: ownerWallet})
    const {uniswapRouter} = await deployUniswap({WETH, wallet: ownerWallet})

    await expect(
      deployAndAddUniswapProcessor({
        contract,
        wallet: otherWallet,
        WETH,
        uniswapRouter
      })
    ).to.be.revertedWith(
      'VM Exception while processing transaction: revert Ownable: caller is not the owner'
    )
  })

  it('fails when trying to use a pre-processors that is not whitelisted', async () => {
    const {contract, ownerWallet, otherWallet} = await loadFixture(fixture)
    const {WETH} = await deployWETH({wallet: ownerWallet})
    const {uniswapRouter} = await deployUniswap({WETH, wallet: ownerWallet})

    const {processorContract} = await deployAndAddUniswapProcessor({
      contract,
      wallet: ownerWallet,
      WETH,
      uniswapRouter
    })

    await expect(
      pay({
        contract,
        wallet: ownerWallet,
        path: [ZERO],
        amountIn: 1000,
        amountOut: 1000,
        receiver: otherWallet.address,
        preProcessors: [otherWallet.address],
        value: 1000
      })
    ).to.be.revertedWith(
      'VM Exception while processing transaction: revert DePay: Processor not whitelisted'
    )
  })

  it('fails when trying to use a post-processors that is not whitelisted', async () => {
    const {contract, ownerWallet, otherWallet} = await loadFixture(fixture)
    const {WETH} = await deployWETH({wallet: ownerWallet})
    const {uniswapRouter} = await deployUniswap({WETH, wallet: ownerWallet})

    const {processorContract} = await deployAndAddUniswapProcessor({
      contract,
      wallet: ownerWallet,
      WETH,
      uniswapRouter
    })

    await expect(
      pay({
        contract,
        wallet: ownerWallet,
        path: [ZERO],
        amountIn: 1000,
        amountOut: 1000,
        receiver: otherWallet.address,
        postProcessors: [otherWallet.address],
        value: 1000
      })
    ).to.be.revertedWith(
      'VM Exception while processing transaction: revert DePay: Processor not whitelisted'
    )
  })

  it('swaps tokens via uniswap to perform a payment', async () => {
    const {contract, ownerWallet, otherWallet} = await loadFixture(fixture)

    const token0 = await deployContract(ownerWallet, TestToken)
    const token1 = await deployContract(ownerWallet, TestToken)

    const {WETH} = await deployWETH({wallet: ownerWallet})
    const {uniswapFactory, uniswapRouter} = await deployUniswap({WETH, wallet: ownerWallet})

    const {processorContract} = await deployAndAddUniswapProcessor({
      contract,
      wallet: ownerWallet,
      WETH,
      uniswapRouter
    })
    
    let pair1Address = await createUniswapPair({
      token0: WETH,
      token1: token0,
      WETH,
      router: uniswapRouter,
      wallet: ownerWallet,
      uniswapFactory: uniswapFactory
    })

    let pair2Address = await createUniswapPair({
      token0: WETH,
      token1: token1,
      WETH,
      router: uniswapRouter,
      wallet: ownerWallet,
      uniswapFactory: uniswapFactory
    })

    await token0.connect(ownerWallet).approve(contract.address, MAXINT)

    let path = [token0.address, WETH.address, token1.address]
    let amountOut = 1000
    let amounts = await uniswapRouter.getAmountsIn(amountOut, path)
    let amountIn = amounts[0].toNumber()

    await expect(() => 
      pay({
        contract,
        wallet: ownerWallet,
        path: path,
        amountIn: amountIn,
        amountOut: amountOut,
        receiver: otherWallet.address,
        preProcessors: [processorContract.address]
      })
    ).to.changeTokenBalance(token1, otherWallet, 1000)
  })

  it('swaps ETH to token via uniswap to perform a payment', async () => {
    const {contract, ownerWallet, otherWallet} = await loadFixture(fixture)

    const token0 = await deployContract(ownerWallet, TestToken)

    const {WETH} = await deployWETH({wallet: ownerWallet})
    const {uniswapFactory, uniswapRouter} = await deployUniswap({WETH, wallet: ownerWallet})

    const {processorContract} = await deployAndAddUniswapProcessor({
      contract,
      wallet: ownerWallet,
      WETH,
      uniswapRouter
    })
    
    let pair1Address = await createUniswapPair({
      token0: WETH,
      token1: token0,
      WETH,
      router: uniswapRouter,
      wallet: ownerWallet,
      uniswapFactory: uniswapFactory
    })

    await token0.connect(ownerWallet).approve(contract.address, MAXINT)

    let amountOut = 1000
    let amounts = await uniswapRouter.getAmountsIn(amountOut, [WETH.address, token0.address])
    let amountIn = amounts[0].toNumber()

    await expect(() => 
      pay({
        contract,
        wallet: ownerWallet,
        path: [ZERO, token0.address],
        amountIn: amountIn,
        amountOut: amountOut,
        receiver: otherWallet.address,
        preProcessors: [processorContract.address],
        value: amountIn
      })
    ).to.changeTokenBalance(token0, otherWallet, 1000)
  })

  it('swaps tokens for ETH via uniswap to performf a payment', async () => {
    const {contract, ownerWallet, otherWallet} = await loadFixture(fixture)

    const token0 = await deployContract(ownerWallet, TestToken)

    const {WETH} = await deployWETH({wallet: ownerWallet})
    const {uniswapFactory, uniswapRouter} = await deployUniswap({WETH, wallet: ownerWallet})

    const {processorContract} = await deployAndAddUniswapProcessor({
      contract,
      wallet: ownerWallet,
      WETH,
      uniswapRouter
    })
    
    let pair1Address = await createUniswapPair({
      token0: WETH,
      token1: token0,
      WETH,
      router: uniswapRouter,
      wallet: ownerWallet,
      uniswapFactory: uniswapFactory
    })

    await token0.connect(ownerWallet).approve(contract.address, MAXINT)

    let amountOut = 1000
    let amounts = await uniswapRouter.getAmountsIn(amountOut, [token0.address, WETH.address])
    let amountIn = amounts[0].toNumber()

    await expect(() => 
      pay({
        contract,
        wallet: ownerWallet,
        path: [token0.address, ZERO],
        amountIn: amountIn,
        amountOut: amountOut,
        receiver: otherWallet.address,
        preProcessors: [processorContract.address],
        value: amountIn
      })
    ).to.changeEtherBalance(otherWallet, 1000)
  })

  it('allows owner to withdraw ETH that remained in the contract', async () => {
    const {contract, ownerWallet, otherWallet} = await loadFixture(fixture)
    await otherWallet.sendTransaction({ to: contract.address, value: 1000, gasPrice: 0 })
    
    await expect(
      await contract.connect(ownerWallet).withdraw('0x0000000000000000000000000000000000000000', 1000)
    ).to.changeEtherBalance(ownerWallet, 1000)
  })

  it('does not allow others to withdraw ETH that remained in the contract', async () => {
    const {contract, ownerWallet, otherWallet} = await loadFixture(fixture)
    await otherWallet.sendTransaction({ to: contract.address, value: 1000, gasPrice: 0 })
    
    await expect(
      contract.connect(otherWallet).withdraw('0x0000000000000000000000000000000000000000', 1000)
    ).to.be.revertedWith(
      'VM Exception while processing transaction: revert Ownable: caller is not the owner'
    )
  })

  it('allows owner to withdraw tokens that remained in the contract', async () => {
    const {contract, ownerWallet, otherWallet} = await loadFixture(fixture)
    const testTokenContract = await deployContract(otherWallet, TestToken)
    await testTokenContract.transfer(contract.address, 1000)

    await expect(() => 
      contract.connect(ownerWallet).withdraw(testTokenContract.address, 1000)
    ).to.changeTokenBalance(testTokenContract, ownerWallet, 1000)
  })

  it('does not allow others to withdraw tokens that remained in the contract', async () => {
    const {contract, ownerWallet, otherWallet} = await loadFixture(fixture)
    const testTokenContract = await deployContract(otherWallet, TestToken)
    await testTokenContract.transfer(contract.address, 1000)

    await expect(
      contract.connect(otherWallet).withdraw(testTokenContract.address, 1000)
    ).to.be.revertedWith(
      'VM Exception while processing transaction: revert Ownable: caller is not the owner'
    )
  })
})
