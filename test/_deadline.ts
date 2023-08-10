import Web3Blockchains from '@depay/web3-blockchains'
import deploy from './_helpers/deploy'
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
        router = await deploy()
      })

      it('fails if payment deadline has passed', async ()=> {

        await expect(
          router.connect(wallets[0]).pay({
            amountIn: 1000000000,
            paymentAmount: 1000000000,
            feeAmount: 1,
            tokenInAddress: NATIVE,
            exchangeAddress: ZERO,
            tokenOutAddress: NATIVE,
            paymentReceiverAddress: wallets[1].address,
            feeReceiverAddress: ZERO,
            exchangeType: 0,
            receiverType: 0,
            exchangeCallData: ZERO,
            receiverCallData: ZERO,
            deadline: 0,
          }, { value: 1000000000 })
        ).to.be.revertedWith(
          'DePay: Payment deadline has passed!'
        )
      })
    })
  })
}
