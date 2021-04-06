import '@nomiclabs/hardhat-ethers'
import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { JsonDb } from './helpers/json-db'
import path from 'path'
import { TestToken } from '../typechain/TestToken'
import { DePayRouterV1SushiSwap01 } from '../typechain/DePayRouterV1SushiSwap01'
import { DePayRouterV1 } from '../typechain/DePayRouterV1'
import { DePayRouterV1Configuration } from '../typechain/DePayRouterV1Configuration'
import { UniswapV2Router02 } from '../typechain/UniswapV2Router02'
import { now, ETH } from '../test/utils'

const addresses = {
  ropsten: {
    owner: '0x317D875cA3B9f8d14f960486C0d1D1913be74e90',
    sushiSwapRouter: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
    configuration: '0x7974d891822709cf8B1fCB2891AfA9d1BD836D19',
    depayRouterv1: '0x82154Ea9C2DC4C06D6719cE08728F5cFC9422B1D',
    ETH,
    YANG: '0xd4FeA30FFD7f85f0f98dEc6Ad2E1054328fd4bfc',
    WETH: '0xc778417E063141139Fce010982780140Aa0cD5Ab'
  }
}

const override = { gasLimit: 4000000 }

task('sushi:test', 'Deploy CurveFi on given network').setAction(async (_args: any, hre: HardhatRuntimeEnvironment) => {
  // If network is ropsten we will load deployed contracts
  const db = new JsonDb(hre.network.name === 'ropsten', path.join(process.cwd(), 'sushi-deployed.json'))
  const [owner] = await hre.ethers.getSigners()

  async function contractDeploy(contractName: string, ...params: any[]) {
    const instanceFactory = await hre.ethers.getContractFactory(contractName)
    const instance = await instanceFactory.connect(owner).deploy(...params)
    db.set(contractName, instance.address)
    console.log('Deploy', contractName, 'at', instance.address)
    return instance
  }

  async function contractGet(contractName: string) {
    const instanceFactory = await hre.ethers.getContractFactory(contractName)
    const instance = instanceFactory.attach(db.get(contractName))
    console.log('Load', contractName, 'at', instance.address)
    return instance
  }

  async function deployIfNotExist(contractName: string, ...params: any[]) {
    return !db.has(contractName) ? contractDeploy(contractName, ...params) : contractGet(contractName)
  }

  async function TokenAt(tokenAddress: string) {
    const instanceFactory = await hre.ethers.getContractFactory('TestToken')
    const instance = <TestToken>instanceFactory.attach(tokenAddress)
    console.log('Load ERC20 token at', instance.address)
    return instance
  }

  const uniswapRouterFactory = await hre.ethers.getContractFactory('UniswapV2Router02')
  const instanceUniswapRouter = <UniswapV2Router02>uniswapRouterFactory.attach(addresses.ropsten.sushiSwapRouter)

  const instanceSushiSwapPlugin = <DePayRouterV1SushiSwap01>(
    await deployIfNotExist('DePayRouterV1SushiSwap01', addresses.ropsten.WETH, addresses.ropsten.sushiSwapRouter)
  )

  const depayRouterV1Factory = await hre.ethers.getContractFactory('DePayRouterV1')
  const depayRouterV1 = <DePayRouterV1>depayRouterV1Factory.attach(addresses.ropsten.depayRouterv1)

  // Approve plugin if network is hardhat
  if (hre.network.name === 'hardhat') {
    console.log('>> We are on', hre.network.name, ', we will try to perform approve plugin')

    const depayRouterConfigurationFactory = await hre.ethers.getContractFactory('DePayRouterV1Configuration')
    const depayRouterConfiguration = <DePayRouterV1Configuration>(
      depayRouterConfigurationFactory.attach(addresses.ropsten.configuration)
    )

    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [addresses.ropsten.owner]
    })

    await depayRouterConfiguration
      .connect(await hre.ethers.provider.getSigner(addresses.ropsten.owner))
      .approvePlugin(instanceSushiSwapPlugin.address, override)
  }

  const instanceWETH = await TokenAt(addresses.ropsten.YANG)

  if ((await instanceWETH.allowance(owner.address, depayRouterV1.address)).lte(1000)) {
    console.log('>> Allowing DepayRouterV1 to move WETH')
    await instanceWETH.connect(owner).approve(depayRouterV1.address, '1000000000000000000', override)
  }

  if (await depayRouterV1.isApproved(instanceSushiSwapPlugin.address)) {
    let amountOut = 1000000
    let amounts = await instanceUniswapRouter.getAmountsIn(amountOut, [
      addresses.ropsten.WETH,
      addresses.ropsten.YANG
    ])
    let amountIn = amounts[0].toNumber()
    await depayRouterV1
      .connect(owner)
      .route(
        [addresses.ropsten.ETH, addresses.ropsten.YANG],
        [amountIn, amountOut, now() + 60000],
        [],
        [instanceSushiSwapPlugin.address],
        [],
        { ...override, value: amountIn }
      )
    console.log('>> Completed swap!!')
  } else {
    console.log("Plugin wasn't approved")
  }
})
