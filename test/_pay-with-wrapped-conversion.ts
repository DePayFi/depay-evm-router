import deployRouter from './_helpers/deploy/router'
import now from './_helpers/now'
import Token from '@depay/web3-tokens-evm'
import Web3Blockchains from '@depay/web3-blockchains'
import { ethers } from 'hardhat'
import { expect } from 'chai'

export default ({ blockchain })=>{

  const NATIVE = Web3Blockchains[blockchain].currency.address
  const WRAPPED = Web3Blockchains[blockchain].wrapped.address
  const ZERO = Web3Blockchains[blockchain].zero
  const provider = ethers.provider

  describe(`DePayRouterV2 on ${blockchain}`, ()=> {

    describe(`pay with WRAPPED conversion`, ()=> {

      let wallets
      let router
      let deadline
      let wrapperContract

      beforeEach(async ()=>{
        wallets = await ethers.getSigners()
        deadline = now()+ 86400 // 1 day
        wrapperContract = new ethers.Contract(WRAPPED, Token[blockchain].WRAPPED, wallets[0])
      })

      it('deploys router successfully', async ()=> {
        router = await deployRouter({ WRAPPED })
      })

      it('approves WRAPPER contract as exchange to convert payments', async ()=> {
        await router.connect(wallets[0]).approve(WRAPPED)
      })

      it('wraps NATIVE to WRAPPED and pays out WRAPPED', async ()=>{
        const amountIn = 1000000000
        const paymentAmount = 900000000
        const feeAmount = 100000000

        const callData = wrapperContract.interface.encodeFunctionData("deposit", [])

        const paymentReceiverBalanceBefore = await wrapperContract.balanceOf(wallets[1].address)
        const feeReceiverBalanceBefore = await wrapperContract.balanceOf(wallets[2].address)

        await router.connect(wallets[0]).pay(
          amountIn, // amountIn
          NATIVE, // tokenIn
          WRAPPED, // exchangeAddress
          callData, // exchangeCall
          WRAPPED, // tokenOut
          paymentAmount, // paymentAmount
          wallets[1].address, // paymentReceiver
          feeAmount, // feeAmount
          wallets[2].address, // feeReceiver
          deadline, // deadline
          { value: 1000000000 }
        )

        const paymentReceiverBalanceAfter = await await wrapperContract.balanceOf(wallets[1].address)
        const feeReceiverBalanceAfter = await await wrapperContract.balanceOf(wallets[2].address)

        expect(paymentReceiverBalanceAfter).to.eq(paymentReceiverBalanceBefore.add(paymentAmount))
        expect(feeReceiverBalanceAfter).to.eq(feeReceiverBalanceBefore.add(feeAmount))
      })

      it('unwraps WRAPPED to NATIVE and pays out NATIVE', async ()=>{

        const amountIn = 1000000000
        const paymentAmount = 900000000
        const feeAmount = 100000000

        const callData = wrapperContract.interface.encodeFunctionData("withdraw", [amountIn])

        const paymentReceiverBalanceBefore = await provider.getBalance(wallets[1].address)
        const feeReceiverBalanceBefore = await provider.getBalance(wallets[2].address)

        await wrapperContract.connect(wallets[0]).deposit({ value: amountIn })
        await wrapperContract.connect(wallets[0]).approve(router.address, amountIn)

        await router.connect(wallets[0]).pay(
          amountIn, // amountIn
          WRAPPED, // tokenIn
          WRAPPED, // exchangeAddress
          callData, // exchangeCall
          NATIVE, // tokenOut
          paymentAmount, // paymentAmount
          wallets[1].address, // paymentReceiver
          feeAmount, // feeAmount
          wallets[2].address, // feeReceiver
          deadline // deadline
        )

        const paymentReceiverBalanceAfter = await await provider.getBalance(wallets[1].address)
        const feeReceiverBalanceAfter = await await provider.getBalance(wallets[2].address)

        expect(paymentReceiverBalanceAfter).to.eq(paymentReceiverBalanceBefore.add(paymentAmount))
        expect(feeReceiverBalanceAfter).to.eq(feeReceiverBalanceBefore.add(feeAmount))
      })
    })
  })
}
