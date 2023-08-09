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

    describe(`pay with NATIVE`, ()=> {

      let wallets
      let router
      let deadline

      beforeEach(async ()=>{
        wallets = await ethers.getSigners()
        deadline = now()+ 86400 // 1 day
      })

      it('deploys router successfully', async ()=> {
        router = await deployRouter()
      })

      it('fails if native amount was not paid in', async ()=> {
        await expect(
          router.connect(wallets[0]).pay(
            [ // amounts
              1000000000, // amountIn
              1000000000, // paymentAmount
              0 // feeAmount
            ],
            [ // addresses
              NATIVE, // tokenIn
              ZERO, // exchangeAddress
              NATIVE, // tokenOut
              wallets[1].address, // paymentReceiver
              ZERO, // feeReceiver
            ],
            [], // types
            [ // calls
              ZERO, // exchangeCall
            ],
            deadline, // deadline
          )
        ).to.be.revertedWith(
          'DePay: Insufficient amount paid in!'
        )
      })

      it('pays payment receiver and emits Transfer polyfil event', async ()=> {
        const amountIn = 1000000000
        const paymentAmount = 1000000000

        const paymentReceiverBalanceBefore = await provider.getBalance(wallets[1].address)

        await expect(
          router.connect(wallets[0]).pay(
            [ // amounts
              amountIn, // amountIn
              paymentAmount, // paymentAmount
              0 // feeAmount
            ],
            [ // addresses
              NATIVE, // tokenIn
              ZERO, // exchangeAddress
              NATIVE, // tokenOut
              wallets[1].address, // paymentReceiver
              ZERO, // feeReceiver
            ],
            [], // types
            [ // calls
              ZERO, // exchangeCall
            ],
            deadline, // deadline
            { value: 1000000000 }
          )
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
          router.connect(wallets[0]).pay(
            [ // amounts
              amountIn, // amountIn
              paymentAmount, // paymentAmount
              feeAmount // feeAmount
            ],
            [ // addresses
              NATIVE, // tokenIn
              ZERO, // exchangeAddress
              NATIVE, // tokenOut
              wallets[1].address, // paymentReceiver
              wallets[2].address, // feeReceiver
            ],
            [], // types
            [ // calls
              ZERO, // exchangeCall
            ],
            deadline, // deadline
            { value: 1000000000 }
          )
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
          router.connect(wallets[0]).pay(
            [ // amounts
              0, // amountIn
              1000000000, // paymentAmount
              0 // feeAmount
            ],
            [ // addresses
              NATIVE, // tokenIn
              ZERO, // exchangeAddress
              NATIVE, // tokenOut
              wallets[1].address, // paymentReceiver
              ZERO, // feeReceiver
            ],
            [], // types
            [ // calls
              ZERO, // exchangeCall
            ],
            deadline, // deadline
          )
        ).to.be.revertedWith(
          'DePay: Insufficient balanceIn after payment!'
        )
      })
    })
  })
}
