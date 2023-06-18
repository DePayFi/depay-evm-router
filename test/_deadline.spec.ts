import Web3Blockchains from '@depay/web3-blockchains'
import deployRouter from './_helpers/deploy/router'
import now from './_helpers/now'
import { ethers } from 'hardhat'
import { expect } from 'chai'

export default ({ blockchain })=>{

  const NATIVE = Web3Blockchains[blockchain].currency.address
  const WRAPPED = Web3Blockchains[blockchain].wrapped.address
  const ZERO = Web3Blockchains[blockchain].zero
  const provider = ethers.provider

  describe(`DePayRouterV2 on ${blockchain}`, ()=> {

    describe(`DEADLINE`, ()=> {

      let wallets
      let router
      let deadline

      beforeEach(async ()=>{
        wallets = await ethers.getSigners()
        deadline = now()+ 86400 // 1 day
      })

      it('deploys router successfully', async ()=> {
        router = await deployRouter({ WRAPPED })
      })

      it('fails if payment deadline has passed', async ()=> {
        await expect(
          router.connect(wallets[0]).pay(
            1000000000, // amountIn
            NATIVE, // tokenIn
            ZERO, // exchangeAddress
            ZERO, // exchangeCall
            NATIVE, // tokenOut
            1000000000, // paymentAmount
            wallets[1].address, // paymentReceiver
            0, // feeAmount
            ZERO, // feeReceiver
            0, // deadline
            { value: 1000000000 }
          )
        ).to.be.revertedWith(
          'DePay: Payment deadline has passed!'
        )
      })
    })
  })
}
