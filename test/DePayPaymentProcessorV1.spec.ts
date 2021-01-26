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
import StakingPool from '../artifacts/contracts/test/StakingPool.sol/StakingPool.json'
import WETH9 from '../artifacts/contracts/test/WETH9.sol/WETH9.json'
import DePayPaymentProcessorV1Uniswap01 from '../artifacts/contracts/DePayPaymentProcessorV1Uniswap01.sol/DePayPaymentProcessorV1Uniswap01.json'
import DePayPaymentProcessorV1ApproveAndCallContractAddressAmount01 from '../artifacts/contracts/DePayPaymentProcessorV1ApproveAndCallContractAddressAmount01.sol/DePayPaymentProcessorV1ApproveAndCallContractAddressAmount01.json'

const { ethers } = require("hardhat")

const ZERO = '0x0000000000000000000000000000000000000000'
const MAXINT = BigNumber.from("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")

chai.use(solidity)

let now = () => Math.round(new Date().getTime() / 1000)

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

  interface deployAndApproveUniswapProcessorParameters {
    contract: Contract,
    wallet: Wallet,
    WETH: Contract,
    uniswapRouter: Contract
  }

  async function deployAndApproveUniswapProcessor({
    contract,
    wallet,
    WETH,
    uniswapRouter
  }: deployAndApproveUniswapProcessorParameters) {
    const uniswapProcessorContract = await deployContract(wallet, DePayPaymentProcessorV1Uniswap01, [WETH.address, uniswapRouter.address])
    await contract.connect(wallet).approveProcessor(uniswapProcessorContract.address)
    return { uniswapProcessorContract }
  }

  interface deployAndApproveContractCallProcessorParameters {
    contract: Contract,
    wallet: Wallet
  }

  async function deployAndApproveContractCallProcessor({
    contract,
    wallet
  }: deployAndApproveContractCallProcessorParameters) {
    const contractCallProcessorContract = await deployContract(wallet, DePayPaymentProcessorV1ApproveAndCallContractAddressAmount01)
    await contract.connect(wallet).approveProcessor(contractCallProcessorContract.address)
    return { contractCallProcessorContract }
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

  interface payParameters {
    contract: Contract
    wallet: Wallet,
    path: string[],
    amounts: number[],
    addresses: string[],
    processors: string[],
    data?: string[],
    value?: number,
  }

  async function pay({
    contract,
    wallet,
    path,
    amounts,
    addresses,
    processors,
    data = [],
    value = 0
  }: payParameters) {
    return contract.connect(wallet).pay(
      path,
      amounts,
      addresses,
      processors,
      data,
      { value: value }
    )
  }

  it('deploys contract successfully', async () => {
    await loadFixture(fixture)
  })

  it('makes sure DePayPaymentProcessorV1 has the same interface as IDePayPaymentProcessorV1', async () => {
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
        amounts: [1000, 1000],
        addresses: [otherWallet.address],
        processors: [contract.address],
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
        amounts: [1000, 1000],
        addresses: [otherWallet.address],
        processors: [contract.address],
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
        amounts: [1000, 1000],
        addresses: [otherWallet.address],
        processors: [contract.address],
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
        amounts: [1000, 1000],
        addresses: [otherWallet.address],
        processors: [contract.address]
      })
    ).to.changeTokenBalance(testTokenContract, otherWallet, 1000)
  })

  it('allows the contract owner to add payment processors', async () => {
    const {contract, ownerWallet, otherWallet} = await loadFixture(fixture)

    const {WETH} = await deployWETH({wallet: ownerWallet})
    const {uniswapRouter} = await deployUniswap({WETH, wallet: ownerWallet})

    const {uniswapProcessorContract} = await deployAndApproveUniswapProcessor({
      contract,
      wallet: ownerWallet,
      WETH,
      uniswapRouter
    })

    expect(await contract.isApproved(uniswapProcessorContract.address)).to.eq(true)
    expect(await contract.isApproved(otherWallet.address)).to.eq(false)
  })

  it('emits ProcessorApproved when approving new processors', async () => {
    const {contract, ownerWallet, otherWallet} = await loadFixture(fixture)

    const {WETH} = await deployWETH({wallet: ownerWallet})
    const {uniswapRouter} = await deployUniswap({WETH, wallet: ownerWallet})

    const uniswapProcessorContract = await deployContract(ownerWallet, DePayPaymentProcessorV1Uniswap01, [WETH.address, uniswapRouter.address])
    
    await expect(
      contract.approveProcessor(uniswapProcessorContract.address)
    ).to.emit(contract, 'ProcessorApproved')
    .withArgs(
      uniswapProcessorContract.address
    );
  })

  it('does NOT allow others to add payment processors', async () => {
    const {contract, ownerWallet, otherWallet} = await loadFixture(fixture)
    const {WETH} = await deployWETH({wallet: ownerWallet})
    const {uniswapRouter} = await deployUniswap({WETH, wallet: ownerWallet})

    await expect(
      deployAndApproveUniswapProcessor({
        contract,
        wallet: otherWallet,
        WETH,
        uniswapRouter
      })
    ).to.be.revertedWith(
      'VM Exception while processing transaction: revert Ownable: caller is not the owner'
    )
  })

  it('fails when trying to use a pre-processors that is not approved', async () => {
    const {contract, ownerWallet, otherWallet} = await loadFixture(fixture)
    const {WETH} = await deployWETH({wallet: ownerWallet})
    const {uniswapRouter} = await deployUniswap({WETH, wallet: ownerWallet})

    const {uniswapProcessorContract} = await deployAndApproveUniswapProcessor({
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
        amounts: [1000, 1000],
        addresses: [otherWallet.address],
        processors: [otherWallet.address],
        value: 1000
      })
    ).to.be.revertedWith(
      'VM Exception while processing transaction: revert DePay: Processor not approved'
    )
  })

  it('swaps tokens via uniswap to perform a payment', async () => {
    const {contract, ownerWallet, otherWallet} = await loadFixture(fixture)

    const token0 = await deployContract(ownerWallet, TestToken)
    const token1 = await deployContract(ownerWallet, TestToken)

    const {WETH} = await deployWETH({wallet: ownerWallet})
    const {uniswapFactory, uniswapRouter} = await deployUniswap({WETH, wallet: ownerWallet})

    const {uniswapProcessorContract} = await deployAndApproveUniswapProcessor({
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
        amounts: [
          amountIn,
          amountOut,
          now()+10000 // deadline
        ],
        addresses: [otherWallet.address],
        processors: [uniswapProcessorContract.address, contract.address]
      })
    ).to.changeTokenBalance(token1, otherWallet, 1000)
  })

  it('fails when a miner withholds a swap and executes the payment transaction after the deadline has been reached', async () => {
    const {contract, ownerWallet, otherWallet} = await loadFixture(fixture)

    const token0 = await deployContract(ownerWallet, TestToken)
    const token1 = await deployContract(ownerWallet, TestToken)

    const {WETH} = await deployWETH({wallet: ownerWallet})
    const {uniswapFactory, uniswapRouter} = await deployUniswap({WETH, wallet: ownerWallet})

    const {uniswapProcessorContract} = await deployAndApproveUniswapProcessor({
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

    await expect(
      pay({
        contract,
        wallet: ownerWallet,
        path: path,
        amounts: [
          amountIn,
          amountOut,
          now() - 1000 // deadline
        ],
        addresses: [otherWallet.address],
        processors: [uniswapProcessorContract.address, contract.address]
      })
    ).to.be.revertedWith(
      'UniswapV2Router: EXPIRED'
    )
  })

  it('swaps ETH to token via uniswap to perform a payment', async () => {
    const {contract, ownerWallet, otherWallet} = await loadFixture(fixture)

    const token0 = await deployContract(ownerWallet, TestToken)

    const {WETH} = await deployWETH({wallet: ownerWallet})
    const {uniswapFactory, uniswapRouter} = await deployUniswap({WETH, wallet: ownerWallet})

    const {uniswapProcessorContract} = await deployAndApproveUniswapProcessor({
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
        amounts: [
          amountIn,
          amountOut,
          now()+10000 // deadline
        ],
        addresses: [otherWallet.address],
        processors: [uniswapProcessorContract.address, contract.address],
        value: amountIn
      })
    ).to.changeTokenBalance(token0, otherWallet, amountOut)
  })

  it('swaps tokens for ETH via uniswap to perform a payment', async () => {
    const {contract, ownerWallet, otherWallet} = await loadFixture(fixture)

    const token0 = await deployContract(ownerWallet, TestToken)

    const {WETH} = await deployWETH({wallet: ownerWallet})
    const {uniswapFactory, uniswapRouter} = await deployUniswap({WETH, wallet: ownerWallet})

    const {uniswapProcessorContract} = await deployAndApproveUniswapProcessor({
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
        amounts: [
          amountIn,
          amountOut,
          now()+10000 // deadline
        ],
        addresses: [otherWallet.address],
        processors: [uniswapProcessorContract.address, contract.address],
        value: amountIn
      })
    ).to.changeEtherBalance(otherWallet, amountOut)
  })

  it('swaps tokens to tokens via uniswap and calls another contract with the swapped tokens within the same transaction', async () => {
    const {contract, ownerWallet, otherWallet} = await loadFixture(fixture)

    const token0 = await deployContract(ownerWallet, TestToken)
    const token1 = await deployContract(ownerWallet, TestToken)

    const {WETH} = await deployWETH({wallet: ownerWallet})
    const {uniswapFactory, uniswapRouter} = await deployUniswap({WETH, wallet: ownerWallet})

    const {uniswapProcessorContract} = await deployAndApproveUniswapProcessor({
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

    const {contractCallProcessorContract} = await deployAndApproveContractCallProcessor({
      contract,
      wallet: ownerWallet
    })

    const {stakingPoolContract} = await deployStakingPool({
      wallet: ownerWallet,
      token: token1.address
    })

    await expect(
      pay({
        contract,
        wallet: ownerWallet,
        path: path,
        amounts: [
          amountIn,
          amountOut,
          now()+10000 // deadline
        ],
        addresses: [ownerWallet.address, stakingPoolContract.address],
        data: ["depositFor(address,uint256)"],
        processors: [uniswapProcessorContract.address, contractCallProcessorContract.address]
      })
    ).to.emit(stakingPoolContract, 'Deposit')
    .withArgs(
      ownerWallet.address,
      amountOut
    )
  })

  it('emits a Payment event with the smart contract being the receiver of the payment', async () => {
    const {contract, ownerWallet, otherWallet} = await loadFixture(fixture)

    const token0 = await deployContract(ownerWallet, TestToken)
    const token1 = await deployContract(ownerWallet, TestToken)

    const {WETH} = await deployWETH({wallet: ownerWallet})
    const {uniswapFactory, uniswapRouter} = await deployUniswap({WETH, wallet: ownerWallet})

    const {uniswapProcessorContract} = await deployAndApproveUniswapProcessor({
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

    const {contractCallProcessorContract} = await deployAndApproveContractCallProcessor({
      contract,
      wallet: ownerWallet
    })

    const {stakingPoolContract} = await deployStakingPool({
      wallet: ownerWallet,
      token: token1.address
    })

    await expect(
      pay({
        contract,
        wallet: ownerWallet,
        path: path,
        amounts: [
          amountIn,
          amountOut,
          now()+10000 // deadline
        ],
        addresses: [ownerWallet.address, stakingPoolContract.address],
        data: ["depositFor(address,uint256)"],
        processors: [uniswapProcessorContract.address, contractCallProcessorContract.address]
      })
    ).to.emit(contract, 'Payment')
    .withArgs(
      ownerWallet.address,
      stakingPoolContract.address
    )
  })

  it('makes sure that the eth balance in the smart contract is the same after the payment then before', async () => {
    // to prevent people draining the contract

    const {contract, ownerWallet, otherWallet} = await loadFixture(fixture)

    const token0 = await deployContract(ownerWallet, TestToken)

    const {WETH} = await deployWETH({wallet: ownerWallet})
    const {uniswapFactory, uniswapRouter} = await deployUniswap({WETH, wallet: ownerWallet})

    const {uniswapProcessorContract} = await deployAndApproveUniswapProcessor({
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

    await ownerWallet.sendTransaction({to: contract.address, value: 1000})

    await expect(
      pay({
        contract,
        wallet: ownerWallet,
        path: [token0.address, ZERO],
        amounts: [
          amountIn,
          amountOut,
          now()+10000 // deadline
        ],
        addresses: [otherWallet.address],
        processors: [contract.address]
      })
    ).to.be.revertedWith(
      'VM Exception while processing transaction: revert DePay: Insufficient balance after payment!'
    )
  })

  it('makes sure that the token balance in the smart contract is the same after the payment then before', async () => {
    // to prevent people draining the contract

    const {contract, ownerWallet, otherWallet} = await loadFixture(fixture)

    const token0 = await deployContract(ownerWallet, TestToken)

    const {WETH} = await deployWETH({wallet: ownerWallet})
    const {uniswapFactory, uniswapRouter} = await deployUniswap({WETH, wallet: ownerWallet})

    const {uniswapProcessorContract} = await deployAndApproveUniswapProcessor({
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

    await token0.connect(ownerWallet).transfer(contract.address, 5000)

    await expect(
      pay({
        contract,
        wallet: ownerWallet,
        path: [ZERO, token0.address],
        amounts: [
          amountIn,
          amountOut,
          now()+10000
        ],
        addresses: [otherWallet.address],
        processors: [contract.address],
        value: amountIn
      })    
    ).to.be.revertedWith(
      'VM Exception while processing transaction: revert DePay: Insufficient balance after payment!'
    )
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
