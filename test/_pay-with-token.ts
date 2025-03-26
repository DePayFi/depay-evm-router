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
  const PAY = 'pay((uint256,uint256,uint256,uint256,uint256,uint256,address,address,address,address,address,address,uint8,uint8,bool,bytes,bytes))'

  describe(`DePayRouterV3 on ${blockchain}`, ()=> {

    describe(`pay with TOKEN`, ()=> {

      let wallets
      let router
      let deadline
      let tokenContract

      beforeEach(async ()=>{
        wallets = await ethers.getSigners()
        tokenContract = new ethers.Contract(TOKEN, Token[blockchain]['20'], wallets[0])
        if(typeof fromAccount === 'string') { fromAccount = await impersonate(fromAccount) }
        deadline = (now()+3600) * 1000 // 1 hour in milliseconds
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
            feeAmount2: 0,
            protocolAmount: 0,
            tokenInAddress: TOKEN,
            exchangeAddress: ZERO,
            tokenOutAddress: TOKEN,
            paymentReceiverAddress: wallets[1].address,
            feeReceiverAddress: ZERO,
            feeReceiverAddress2: ZERO,
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
        const amountIn = 1000000
        const paymentAmount = 900000

        const paymentReceiverBalanceBefore = await tokenContract.balanceOf(wallets[1].address)

        await tokenContract.connect(fromAccount).approve(router.address, amountIn)

        await expect(
          router.connect(fromAccount)[PAY]({
            amountIn: amountIn,
            paymentAmount: paymentAmount,
            feeAmount: 0,
            feeAmount2: 0,
            protocolAmount: 0,
            tokenInAddress: TOKEN,
            exchangeAddress: ZERO,
            tokenOutAddress: TOKEN,
            paymentReceiverAddress: wallets[1].address,
            feeReceiverAddress: ZERO,
            feeReceiverAddress2: ZERO,
            exchangeType: 0,
            receiverType: 0,
            exchangeCallData: ZERO,
            receiverCallData: ZERO,
            deadline,
          })
        )
        .to.emit(router, 'Payment').withArgs(
          fromAccount._address, // from
          wallets[1].address, // to
          deadline, // deadline
          amountIn, // amountIn
          paymentAmount, // paymentAmount
          0, // feeAmount
          0, // feeAmount2
          0, // protocolAmount
          100000, // slippageInAmount
          0, // slippageOutAmount
          TOKEN, // tokenInAddress
          TOKEN, // tokenOutAddress
          ZERO, // feeReceiverAddress
          ZERO, // feeReceiverAddress2
        )

        const paymentReceiverBalanceAfter = await tokenContract.balanceOf(wallets[1].address)
        expect(paymentReceiverBalanceAfter).to.eq(paymentReceiverBalanceBefore.add(paymentAmount))
      })

      it('pays payment receiver and fee receiver', async ()=> {
        const amountIn = 100000
        const paymentAmount = 90000
        const feeAmount = 10000

        const paymentReceiverBalanceBefore = await tokenContract.balanceOf(wallets[1].address)
        const feeReceiverBalanceBefore = await tokenContract.balanceOf(wallets[2].address)

        await tokenContract.connect(fromAccount).approve(router.address, amountIn)

        await router.connect(fromAccount)[PAY]({
          amountIn: amountIn,
          paymentAmount: paymentAmount,
          feeAmount: feeAmount,
          feeAmount2: 0,
          protocolAmount: 0,
          tokenInAddress: TOKEN,
          exchangeAddress: ZERO,
          tokenOutAddress: TOKEN,
          paymentReceiverAddress: wallets[1].address,
          feeReceiverAddress: wallets[2].address,
          feeReceiverAddress2: ZERO,
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

      it('pays payment receiver, fee receiver and protocol', async ()=> {
        const amountIn = 100000
        const paymentAmount = 90000
        const feeAmount = 5000
        const protocolAmount = 5000

        const paymentReceiverBalanceBefore = await tokenContract.balanceOf(wallets[1].address)
        const feeReceiverBalanceBefore = await tokenContract.balanceOf(wallets[2].address)
        const protocolBalanceBefore = await tokenContract.balanceOf(router.address)

        await tokenContract.connect(fromAccount).approve(router.address, amountIn)

        await expect(
          router.connect(fromAccount)[PAY]({
            amountIn: amountIn,
            paymentAmount: paymentAmount,
            feeAmount: feeAmount,
            feeAmount2: 0,
            protocolAmount: protocolAmount,
            tokenInAddress: TOKEN,
            exchangeAddress: ZERO,
            tokenOutAddress: TOKEN,
            paymentReceiverAddress: wallets[1].address,
            feeReceiverAddress: wallets[2].address,
            feeReceiverAddress2: ZERO,
            exchangeType: 0,
            receiverType: 0,
            exchangeCallData: ZERO,
            receiverCallData: ZERO,
            deadline,
          })
        )
        .to.emit(router, 'Payment').withArgs(
          fromAccount._address, // from
          wallets[1].address, // to
          deadline, // deadline
          amountIn, // amountIn
          paymentAmount, // paymentAmount
          feeAmount, // feeAmount
          0, // feeAmount2
          protocolAmount, // protocolAmount
          0, // slippageInAmount
          0, // slippageOutAmount
          TOKEN, // tokenInAddress
          TOKEN, // tokenOutAddress
          wallets[2].address, // feeReceiverAddress
          ZERO, // feeReceiverAddress2
        )

        const paymentReceiverBalanceAfter = await tokenContract.balanceOf(wallets[1].address)
        const feeReceiverBalanceAfter = await tokenContract.balanceOf(wallets[2].address)
        const protocolBalanceAfter = await tokenContract.balanceOf(router.address)

        expect(paymentReceiverBalanceAfter).to.eq(paymentReceiverBalanceBefore.add(paymentAmount))
        expect(feeReceiverBalanceAfter).to.eq(feeReceiverBalanceBefore.add(feeAmount))
        expect(protocolBalanceAfter).to.eq(protocolBalanceBefore.add(protocolAmount))
      })

      it('fails if balanceIn is less after payment', async()=>{
        const amountIn = 1000000
        const paymentAmount = 1000000
        const feeAmount = 100000

        const paymentReceiverBalanceBefore = await tokenContract.balanceOf(wallets[1].address)
        const feeReceiverBalanceBefore = await tokenContract.balanceOf(wallets[2].address)

        await tokenContract.connect(fromAccount).approve(router.address, amountIn)

        await tokenContract.connect(fromAccount).transfer(router.address, feeAmount)

        await expect(
          router.connect(fromAccount)[PAY]({
            amountIn: amountIn,
            paymentAmount: paymentAmount,
            feeAmount: feeAmount,
            feeAmount2: 0,
            protocolAmount: 0,
            tokenInAddress: TOKEN,
            exchangeAddress: ZERO,
            tokenOutAddress: TOKEN,
            paymentReceiverAddress: wallets[1].address,
            feeReceiverAddress: wallets[2].address,
            feeReceiverAddress2: ZERO,
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

      it('fails if protocolAmount is less than specified', async ()=> {
        const amountIn = 100000
        const paymentAmount = 90000
        const feeAmount = 5000
        const protocolAmount = 5000

        await expect(
          router.connect(fromAccount)[PAY]({
            amountIn: amountIn,
            paymentAmount: paymentAmount,
            feeAmount: feeAmount,
            feeAmount2: 0,
            protocolAmount: 6000,
            tokenInAddress: TOKEN,
            exchangeAddress: ZERO,
            tokenOutAddress: TOKEN,
            paymentReceiverAddress: wallets[1].address,
            feeReceiverAddress: wallets[2].address,
            feeReceiverAddress2: ZERO,
            exchangeType: 0,
            receiverType: 0,
            exchangeCallData: ZERO,
            receiverCallData: ZERO,
            deadline,
          })
        ).to.be.revertedWith(
          'InsufficientProtocolAmount()'
        )
      })

    })
  })
}
