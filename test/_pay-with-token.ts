import deploy from './_helpers/deploy'
import impersonate from './_helpers/impersonate'
import now from './_helpers/now'
import Token from '@depay/web3-tokens-evm'
import Blockchains from '@depay/web3-blockchains'
import { ethers } from 'hardhat'
import { expect } from 'chai'

export default ({ blockchain, token, fromAccount, reversalReason })=>{

  const NATIVE = Blockchains[blockchain].currency.address
  const WRAPPED = Blockchains[blockchain].wrapped.address
  const TOKEN = token
  const ZERO = Blockchains[blockchain].zero
  const provider = ethers.provider
  const PAY = 'pay((uint256,bool,uint256,uint256,address,address,address,address,address,uint8,uint8,bytes,bytes,uint256))'

  describe(`DePayRouterV2 on ${blockchain}`, ()=> {

    describe(`pay with TOKEN`, ()=> {

      let wallets
      let router
      let deadline
      let tokenContract

      beforeEach(async ()=>{
        wallets = await ethers.getSigners()
        tokenContract = new ethers.Contract(TOKEN, Token[blockchain]['20'], wallets[0])
        if(typeof fromAccount === 'string') { fromAccount = await impersonate(fromAccount) }
        deadline = now()+ 86400 // 1 day
      })

      it('deploys router successfully', async ()=> {
        router = await deploy()
      })

      it('fails if approval was not granted and amount was not paid in', async ()=> {
        await expect(
          router.connect(fromAccount)[PAY]({
            amountIn: 1000000000,
            paymentAmount: 1000000000,
            feeAmount: 0,
            tokenInAddress: TOKEN,
            exchangeAddress: ZERO,
            tokenOutAddress: TOKEN,
            paymentReceiverAddress: wallets[1].address,
            feeReceiverAddress: ZERO,
            exchangeType: 0,
            receiverType: 0,
            exchangeCallData: ZERO,
            receiverCallData: ZERO,
            deadline,
          })
        ).to.be.revertedWith(
          reversalReason
        )
      })

      it('pays payment receiver', async ()=> {
        const amountIn = 1000000000
        const paymentAmount = 1000000000

        const paymentReceiverBalanceBefore = await tokenContract.balanceOf(wallets[1].address)

        await tokenContract.connect(fromAccount).approve(router.address, amountIn)

        await router.connect(fromAccount)[PAY]({
          amountIn: amountIn,
          paymentAmount: paymentAmount,
          feeAmount: 0,
          tokenInAddress: TOKEN,
          exchangeAddress: ZERO,
          tokenOutAddress: TOKEN,
          paymentReceiverAddress: wallets[1].address,
          feeReceiverAddress: ZERO,
          exchangeType: 0,
          receiverType: 0,
          exchangeCallData: ZERO,
          receiverCallData: ZERO,
          deadline,
        })

        const paymentReceiverBalanceAfter = await tokenContract.balanceOf(wallets[1].address)
        expect(paymentReceiverBalanceAfter).to.eq(paymentReceiverBalanceBefore.add(paymentAmount))
      })

      it('pays payment receiver and fee receiver', async ()=> {
        const amountIn = 1000000000
        const paymentAmount = 900000000
        const feeAmount = 100000000

        const paymentReceiverBalanceBefore = await tokenContract.balanceOf(wallets[1].address)
        const feeReceiverBalanceBefore = await tokenContract.balanceOf(wallets[2].address)

        await tokenContract.connect(fromAccount).approve(router.address, amountIn)

        await router.connect(fromAccount)[PAY]({
          amountIn: amountIn,
          paymentAmount: paymentAmount,
          feeAmount: feeAmount,
          tokenInAddress: TOKEN,
          exchangeAddress: ZERO,
          tokenOutAddress: TOKEN,
          paymentReceiverAddress: wallets[1].address,
          feeReceiverAddress: wallets[2].address,
          exchangeType: 0,
          receiverType: 0,
          exchangeCallData: ZERO,
          receiverCallData: ZERO,
          deadline,
        })

        const paymentReceiverBalanceAfter = await tokenContract.balanceOf(wallets[1].address)
        const feeReceiverBalanceAfter = await tokenContract.balanceOf(wallets[2].address)

        expect(paymentReceiverBalanceAfter).to.eq(paymentReceiverBalanceBefore.add(paymentAmount))
        expect(feeReceiverBalanceAfter).to.eq(feeReceiverBalanceBefore.add(feeAmount))
      })

      it('fails if balanceIn is less after payment', async()=>{
        const amountIn = 1000000000
        const paymentAmount = 1000000000
        const feeAmount = 100000000

        const paymentReceiverBalanceBefore = await tokenContract.balanceOf(wallets[1].address)
        const feeReceiverBalanceBefore = await tokenContract.balanceOf(wallets[2].address)

        await tokenContract.connect(fromAccount).approve(router.address, amountIn)

        await tokenContract.connect(fromAccount).transfer(router.address, feeAmount)

        await expect(
          router.connect(fromAccount)[PAY]({
            amountIn: amountIn,
            paymentAmount: paymentAmount,
            feeAmount: feeAmount,
            tokenInAddress: TOKEN,
            exchangeAddress: ZERO,
            tokenOutAddress: TOKEN,
            paymentReceiverAddress: wallets[1].address,
            feeReceiverAddress: wallets[2].address,
            exchangeType: 0,
            receiverType: 0,
            exchangeCallData: ZERO,
            receiverCallData: ZERO,
            deadline,
          })
        ).to.be.revertedWith(
          'InsufficientBalanceInAfterPayment()'
        )
      })
    })
  })
}
