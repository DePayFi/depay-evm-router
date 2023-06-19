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

    describe(`approve exchange`, ()=> {

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

      it('only allows the owner to approve exchanges', async ()=> {
        await expect(
          router.connect(wallets[0]).approve(WRAPPED)
        ).to.emit(router, 'Approved').withArgs(WRAPPED)

        let isApproved = await router.connect(wallets[0]).exchanges(WRAPPED)
        expect(isApproved).to.eq(true)
      })

      it('does not allow others to approve exchanges', async ()=> {
        await expect(
          router.connect(wallets[1]).approve(WRAPPED)
        ).to.be.revertedWith(
          'Ownable: caller is not the owner'
        )
      })

      it('fails if trying to convert through a not-approved exchange', async ()=> {
        await expect(
          router.connect(wallets[0]).pay(
            1000000000, // amountIn
            NATIVE, // tokenIn
            "0x00000000000080C886232E9b7EBBFb942B5987AA", // exchangeAddress
            ZERO, // exchangeCall
            NATIVE, // tokenOut
            1000000000, // paymentAmount
            wallets[1].address, // paymentReceiver
            0, // feeAmount
            ZERO, // feeReceiver
            deadline,
            { value: 1000000000 } // deadline
          )
        ).to.be.revertedWith(
          'DePay: Exchange has not been approved!'
        )
      })
    })
  })
}
