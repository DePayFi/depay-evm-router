import deployRouter from './_helpers/deploy/router'
import impersonate from './_helpers/impersonate'
import now from './_helpers/now'
import Token from '@depay/web3-tokens-evm'
import Web3Blockchains from '@depay/web3-blockchains'
import { ethers } from 'hardhat'
import { expect } from 'chai'

export default ({ blockchain, token, fromAccount, reversalReason })=>{

  const NATIVE = Web3Blockchains[blockchain].currency.address
  const WRAPPED = Web3Blockchains[blockchain].wrapped.address
  const TOKEN = token
  const ZERO = Web3Blockchains[blockchain].zero
  const provider = ethers.provider

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
        router = await deployRouter({ WRAPPED })
      })

      it('fails if approval was not granted and amount was not paid in', async ()=> {
        await expect(
          router.connect(fromAccount).pay(
            1000000000, // amountIn
            TOKEN, // tokenIn
            ZERO, // exchangeAddress
            ZERO, // exchangeCall
            TOKEN, // tokenOut
            1000000000, // paymentAmount
            wallets[1].address, // paymentReceiver
            0, // feeAmount
            ZERO, // feeReceiver
            deadline // deadline
          )
        ).to.be.revertedWith(
          reversalReason
        )
      })

      it('pays payment receiver', async ()=> {
        const amountIn = 1000000000
        const paymentAmount = 1000000000

        const paymentReceiverBalanceBefore = await tokenContract.balanceOf(wallets[1].address)

        await tokenContract.connect(fromAccount).approve(router.address, amountIn)

        await router.connect(fromAccount).pay(
          amountIn, // amountIn
          TOKEN, // tokenIn
          ZERO, // exchangeAddress
          ZERO, // exchangeCall
          TOKEN, // tokenOut
          paymentAmount, // paymentAmount
          wallets[1].address, // paymentReceiver
          0, // feeAmount
          ZERO, // feeReceiver
          deadline, // deadline
        )

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

        await router.connect(fromAccount).pay(
          amountIn, // amountIn
          TOKEN, // tokenIn
          ZERO, // exchangeAddress
          ZERO, // exchangeCall
          TOKEN, // tokenOut
          paymentAmount, // paymentAmount
          wallets[1].address, // paymentReceiver
          feeAmount, // feeAmount
          wallets[2].address, // feeReceiver
          deadline, // deadline
        )

        const paymentReceiverBalanceAfter = await tokenContract.balanceOf(wallets[1].address)
        const feeReceiverBalanceAfter = await tokenContract.balanceOf(wallets[2].address)

        expect(paymentReceiverBalanceAfter).to.eq(paymentReceiverBalanceBefore.add(paymentAmount))
        expect(feeReceiverBalanceAfter).to.eq(feeReceiverBalanceBefore.add(feeAmount))
      })

      it('fails if paid out amount was more than paid in', async()=>{
        const amountIn = 1000000000
        const paymentAmount = 1000000000
        const feeAmount = 100000000

        const paymentReceiverBalanceBefore = await tokenContract.balanceOf(wallets[1].address)
        const feeReceiverBalanceBefore = await tokenContract.balanceOf(wallets[2].address)

        await tokenContract.connect(fromAccount).approve(router.address, amountIn)

        await tokenContract.connect(fromAccount).transfer(router.address, feeAmount)

        await expect(
          router.connect(fromAccount).pay(
            amountIn, // amountIn
            TOKEN, // tokenIn
            ZERO, // exchangeAddress
            ZERO, // exchangeCall
            TOKEN, // tokenOut
            paymentAmount, // paymentAmount
            wallets[1].address, // paymentReceiver
            feeAmount, // feeAmount
            wallets[2].address, // feeReceiver
            deadline, // deadline
          )
        ).to.be.revertedWith(
          'DePay: Insufficient balance after payment!'
        )
      })
    })
  })
}
