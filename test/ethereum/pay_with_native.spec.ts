import { ethers } from 'hardhat'
import deployRouter from '../helpers/deploy/router'

const blockchain = 'ethereum'

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
