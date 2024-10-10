import Blockchains from '@depay/web3-blockchains'
import deploy from './_helpers/deploy'
import now from './_helpers/now'
import { ethers } from 'hardhat'
import { expect } from 'chai'

export default ({ blockchain })=>{

  const NATIVE = Blockchains[blockchain].currency.address
  const WRAPPED = Blockchains[blockchain].wrapped.address
  const ZERO = Blockchains[blockchain].zero
  const provider = ethers.provider
  const PAY = 'pay((uint256,uint256,uint256,uint256,uint256,address,address,address,address,address,uint8,uint8,bool,bytes,bytes))'

  describe(`DePayRouterV3 on ${blockchain}`, ()=> {

    describe(`DEADLINE`, ()=> {

      let wallets
      let router
      let deadline

      beforeEach(async ()=>{
        wallets = await ethers.getSigners()
        deadline = (now()+3600) * 1000 // 1 hour in milliseconds
      })

      it('deploys router successfully', async ()=> {
        router = await deploy()
      })

      it('fails if payment deadline has passed', async ()=> {

        await expect(
          router.connect(wallets[0])[PAY]({
            amountIn: 1000000000,
            paymentAmount: 1000000000,
            feeAmount: 1,
            protocolAmount: 0,
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
          'PaymentDeadlineReached()'
        )
      })
    })
  })
}
