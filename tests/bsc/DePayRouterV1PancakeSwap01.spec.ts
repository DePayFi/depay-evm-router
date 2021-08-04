import chai, { expect } from 'chai'
import deployConfiguration from '../helpers/deploy/configuration'
import deployRouter from '../helpers/deploy/router'
import { ethers } from 'hardhat'
import { solidity } from 'ethereum-waffle'

const CONSTANTS = require('depay-web3-constants').CONSTANTS
const findByName = require('depay-web3-exchanges').findByName

describe('DePayRouterV1PancakeSwap01 on BSC', function() {

  let exchange = findByName('pancakeswap')

  let ownerWallet,
      configuration,
      router,
      plugin

  beforeEach(async ()=>{
    [ownerWallet] = await ethers.getSigners()    
  })

  it('requires the router', async () => {
    configuration = await deployConfiguration()
    router = await deployRouter(configuration.address)
  })

  it('deploys the plugin', async () => {
    const Plugin = await ethers.getContractFactory('DePayRouterV1PancakeSwap01')
    plugin = await Plugin.deploy(CONSTANTS.bsc.WRAPPED, exchange.contracts.router.address)
    await plugin.deployed()
  })

  it('approves the plugin', async () => {
    TODO: continue
  })

  it('swaps BNB to BUSD and performs payment with BUSD', async () => {

  })

  it('swaps BUSD to ETH and performs payment with ETH', async () => {

  })

  it('swaps ETH to BUSD and performs payment with BUSD', async () => {

  })
})
