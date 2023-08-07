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

    describe(`pay with exchange conversion`, ()=> {

      let wallets
      let router
      let deadline
      let exchange

      beforeEach(async ()=>{
        wallets = await ethers.getSigners()
        deadline = now()+ 86400 // 1 day
        // exchange = 
      })

      it('deploys router successfully', async ()=> {
        router = await deployRouter({ WRAPPED })
      })

      it('approves exchange contract as exchange to convert payments', async ()=> {
        await router.connect(wallets[0]).approve(WRAPPED)
      })

      // it('converts via exchange as part of the payment', async ()=>{
      //   const amountIn = 1000000000
      //   const paymentAmount = 900000000
      //   const feeAmount = 100000000



      //   const callData = wrapperContract.interface.encodeFunctionData("deposit", [])

      //   const paymentReceiverBalanceBefore = await wrapperContract.balanceOf(wallets[1].address)
      //   const feeReceiverBalanceBefore = await wrapperContract.balanceOf(wallets[2].address)

      //   await router.connect(wallets[0]).pay(
      //     amountIn, // amountIn
      //     NATIVE, // tokenIn
      //     WRAPPED, // exchangeAddress
      //     callData, // exchangeCall
      //     WRAPPED, // tokenOut
      //     paymentAmount, // paymentAmount
      //     wallets[1].address, // paymentReceiver
      //     feeAmount, // feeAmount
      //     wallets[2].address, // feeReceiver
      //     deadline, // deadline
      //     { value: 1000000000 }
      //   )

      //   const paymentReceiverBalanceAfter = await await wrapperContract.balanceOf(wallets[1].address)
      //   const feeReceiverBalanceAfter = await await wrapperContract.balanceOf(wallets[2].address)

      //   expect(paymentReceiverBalanceAfter).to.eq(paymentReceiverBalanceBefore.add(paymentAmount))
      //   expect(feeReceiverBalanceAfter).to.eq(feeReceiverBalanceBefore.add(feeAmount))
      // })

    })
  })
}
