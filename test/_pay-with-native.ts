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
  const PAY = 'pay((uint256,bool,uint256,uint256,address,address,address,address,address,uint8,uint8,bytes,bytes,uint256))'

  describe(`DePayRouterV2 on ${blockchain}`, ()=> {

    describe(`pay with NATIVE`, ()=> {

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

      it('fails if native amount was not paid in', async ()=> {
        await expect(
          router.connect(wallets[0])[PAY]({
            amountIn: 1000000000,
            paymentAmount: 1000000000,
            feeAmount: 0,
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
          'InsufficientAmountPaidIn()'
        )
      })

      it('pays payment receiver and emits Transfer polyfil event', async ()=> {
        const amountIn = 1000000000
        const paymentAmount = 1000000000

        const paymentReceiverBalanceBefore = await provider.getBalance(wallets[1].address)

        await expect(
          router.connect(wallets[0])[PAY]({
            amountIn: amountIn,
            paymentAmount: paymentAmount,
            feeAmount: 0,
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
        ).to.emit(router, 'Transfer').withArgs(wallets[0].address, wallets[1].address, paymentAmount)

        const paymentReceiverBalanceAfter = await provider.getBalance(wallets[1].address)

        expect(paymentReceiverBalanceAfter).to.eq(paymentReceiverBalanceBefore.add(paymentAmount))
      })

      it('pays payment receiver and fee receiver and emits Transfer polyfil event', async ()=> {
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
        .to.emit(router, 'Transfer').withArgs(wallets[0].address, wallets[2].address, feeAmount)
        .to.emit(router, 'Transfer').withArgs(wallets[0].address, wallets[1].address, paymentAmount)

        const paymentReceiverBalanceAfter = await provider.getBalance(wallets[1].address)
        const feeReceiverBalanceAfter = await provider.getBalance(wallets[2].address)

        expect(paymentReceiverBalanceAfter).to.eq(paymentReceiverBalanceBefore.add(paymentAmount))
        expect(feeReceiverBalanceAfter).to.eq(feeReceiverBalanceBefore.add(feeAmount))
      })

      it('fails if balanceIn is less after payment', async()=>{
        await wallets[0].sendTransaction({ to: router.address, value: 1000000000 });
        await expect(
          router.connect(wallets[0])[PAY]({
            amountIn: 0,
            paymentAmount: 1000000000,
            feeAmount: 0,
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
    })
  })
}
