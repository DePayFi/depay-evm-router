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

    describe(`pay with NATIVE`, ()=> {

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

      it('fails if native amount was not paid in', async ()=> {
        await expect(
          router.connect(wallets[0])[PAY]({
            amountIn: 1000000000,
            paymentAmount: 1000000000,
            feeAmount: 0,
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
            deadline,
          }, { value: 0 })
        ).to.be.revertedWith(
          'WrongAmountPaidIn()'
        )
      })

      it('fails if too much of native amount was paid in', async ()=> {
        await expect(
          router.connect(wallets[0])[PAY]({
            amountIn: 1000000000,
            paymentAmount: 1000000000,
            feeAmount: 0,
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
            deadline,
          }, { value: 1100000000 })
        ).to.be.revertedWith(
          'WrongAmountPaidIn()'
        )
      })

      it('pays payment receiver and emits Payment event to validate internal transfers easily', async ()=> {
        const amountIn = 1000000000
        const paymentAmount = 1000000000

        const paymentReceiverBalanceBefore = await provider.getBalance(wallets[1].address)

        await expect(
          router.connect(wallets[0])[PAY]({
            amountIn: amountIn,
            paymentAmount: paymentAmount,
            feeAmount: 0,
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
            deadline,
          }, { value: 1000000000 })
        ).to.emit(router, 'Payment').withArgs(
          wallets[0].address, // from
          wallets[1].address, // to
          deadline, // deadline
          amountIn,
          paymentAmount,
          0,
          0,
          0,
          NATIVE,
          NATIVE,
          ZERO
        )

        const paymentReceiverBalanceAfter = await provider.getBalance(wallets[1].address)

        expect(paymentReceiverBalanceAfter).to.eq(paymentReceiverBalanceBefore.add(paymentAmount))
      })

      it('reverts if payment receiver is zero', async ()=> {
        const amountIn = 1000000000
        const paymentAmount = 1000000000

        const paymentReceiverBalanceBefore = await provider.getBalance(wallets[1].address)

        await expect(
          router.connect(wallets[0])[PAY]({
            amountIn: amountIn,
            paymentAmount: paymentAmount,
            feeAmount: 0,
            protocolAmount: 0,
            tokenInAddress: NATIVE,
            exchangeAddress: ZERO,
            tokenOutAddress: NATIVE,
            paymentReceiverAddress: ZERO,
            feeReceiverAddress: ZERO,
            exchangeType: 0,
            receiverType: 0,
            exchangeCallData: ZERO,
            receiverCallData: ZERO,
            deadline,
          }, { value: 1000000000 })
        ).to.be.revertedWith(
          'PaymentToZeroAddressNotAllowed()'
        )
      })

      it('pays payment receiver and fee receiver and emits Payment event to validate transfers easily', async ()=> {
        const amountIn = 1000000000
        const paymentAmount = 900000000
        const feeAmount = 100000000

        const paymentReceiverBalanceBefore = await provider.getBalance(wallets[1].address)
        const feeReceiverBalanceBefore = await provider.getBalance(wallets[2].address)

        await expect(
          router.connect(wallets[0])[PAY]({
            amountIn: amountIn,
            paymentAmount: paymentAmount,
            feeAmount: feeAmount,
            protocolAmount: 0,
            tokenInAddress: NATIVE,
            exchangeAddress: ZERO,
            tokenOutAddress: NATIVE,
            paymentReceiverAddress: wallets[1].address,
            feeReceiverAddress: wallets[2].address,
            exchangeType: 0,
            receiverType: 0,
            exchangeCallData: ZERO,
            receiverCallData: ZERO,
            deadline,
          }, { value: 1000000000 })
        )
        .to.emit(router, 'Payment').withArgs(
          wallets[0].address, // from
          wallets[1].address, // to
          deadline, // deadline
          amountIn,
          paymentAmount,
          feeAmount,
          0,
          0,
          NATIVE,
          NATIVE,
          wallets[2].address
        )

        const paymentReceiverBalanceAfter = await provider.getBalance(wallets[1].address)
        const feeReceiverBalanceAfter = await provider.getBalance(wallets[2].address)

        expect(paymentReceiverBalanceAfter).to.eq(paymentReceiverBalanceBefore.add(paymentAmount))
        expect(feeReceiverBalanceAfter).to.eq(feeReceiverBalanceBefore.add(feeAmount))
      })

      it('pays payment receiver, fee receiver and protocol and emits Payment event to validate transfers easily', async ()=> {
        const amountIn = 1000000000
        const paymentAmount = 900000000
        const feeAmount = 50000000
        const protocolAmount = 50000000

        const paymentReceiverBalanceBefore = await provider.getBalance(wallets[1].address)
        const feeReceiverBalanceBefore = await provider.getBalance(wallets[2].address)
        const routerBalanceBefore = await provider.getBalance(router.address)

        await expect(
          router.connect(wallets[0])[PAY]({
            amountIn: amountIn,
            paymentAmount: paymentAmount,
            feeAmount: feeAmount,
            protocolAmount: protocolAmount,
            tokenInAddress: NATIVE,
            exchangeAddress: ZERO,
            tokenOutAddress: NATIVE,
            paymentReceiverAddress: wallets[1].address,
            feeReceiverAddress: wallets[2].address,
            exchangeType: 0,
            receiverType: 0,
            exchangeCallData: ZERO,
            receiverCallData: ZERO,
            deadline,
          }, { value: 1000000000 })
        )
        .to.emit(router, 'Payment').withArgs(
          wallets[0].address, // from
          wallets[1].address, // to
          deadline, // deadline
          amountIn,
          paymentAmount,
          feeAmount,
          protocolAmount,
          0,
          NATIVE,
          NATIVE,
          wallets[2].address
        )

        const paymentReceiverBalanceAfter = await provider.getBalance(wallets[1].address)
        const feeReceiverBalanceAfter = await provider.getBalance(wallets[2].address)
        const routerBalanceAfter = await provider.getBalance(router.address)

        expect(paymentReceiverBalanceAfter).to.eq(paymentReceiverBalanceBefore.add(paymentAmount))
        expect(feeReceiverBalanceAfter).to.eq(feeReceiverBalanceBefore.add(feeAmount))
        expect(routerBalanceAfter).to.eq(routerBalanceBefore.add(protocolAmount))
      })

      it('fails if balanceIn is less after payment', async()=>{
        await wallets[0].sendTransaction({ to: router.address, value: 1000000000 });
        await expect(
          router.connect(wallets[0])[PAY]({
            amountIn: 0,
            paymentAmount: 1000000000,
            feeAmount: 0,
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
            deadline,
          }, { value: 0 })
        ).to.be.revertedWith(
          'InsufficientBalanceInAfterPayment()'
        )
      })

      it('fails if protocolAmount is less than specified', async()=>{
        
        const amountIn = 1000000000
        const paymentAmount = 900000000
        const feeAmount = 50000000
        const protocolAmount = 50000000

        const paymentReceiverBalanceBefore = await provider.getBalance(wallets[1].address)
        const feeReceiverBalanceBefore = await provider.getBalance(wallets[2].address)
        const routerBalanceBefore = await provider.getBalance(router.address)

        await expect(
          router.connect(wallets[0])[PAY]({
            amountIn: amountIn,
            paymentAmount: paymentAmount,
            feeAmount: feeAmount,
            protocolAmount: 60000000,
            tokenInAddress: NATIVE,
            exchangeAddress: ZERO,
            tokenOutAddress: NATIVE,
            paymentReceiverAddress: wallets[1].address,
            feeReceiverAddress: wallets[2].address,
            exchangeType: 0,
            receiverType: 0,
            exchangeCallData: ZERO,
            receiverCallData: ZERO,
            deadline,
          }, { value: amountIn })
        ).to.be.revertedWith(
          'InsufficientProtocolAmount()'
        )

      })
    })
  })
}
