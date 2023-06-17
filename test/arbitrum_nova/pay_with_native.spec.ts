import { ethers } from 'hardhat'
import deployRouter from '../_helpers/deploy/router'

const blockchain = 'arbitrum_nova'

describe(`DePayRouterV2 on ${blockchain}`, () => {

  let wallets
  let router

  beforeEach(async ()=>{
    wallets = await ethers.getSigners()
  })

  it('deploys router successfully', async () => {
    router = await deployRouter()
  })

})
