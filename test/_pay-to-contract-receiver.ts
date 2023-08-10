import deploy from './_helpers/deploy'
import getCallData from './_helpers/callData'
import impersonate from './_helpers/impersonate'
import now from './_helpers/now'
import Token from '@depay/web3-tokens-evm'
import Web3Blockchains from '@depay/web3-blockchains'
import Web3Exchanges from '@depay/web3-exchanges-evm'
import { ethers } from 'hardhat'
import { expect } from 'chai'

export default ({ blockchain, toToken, exchange })=>{

  const NATIVE = Web3Blockchains[blockchain].currency.address
  const WRAPPED = Web3Blockchains[blockchain].wrapped.address
  const ZERO = Web3Blockchains[blockchain].zero
  const provider = ethers.provider

  describe(`DePayRouterV2 on ${blockchain}`, ()=> {

    describe(`pay to contract receiver`, ()=> {

      let wallets
      let router
      let deadline
      let fromTokenContract
      let fromAccount
      let toDecimals
      let toTokenContract

      beforeEach(async ()=>{
        toDecimals = await (new Token({ blockchain, address: toToken }).decimals())
        wallets = await ethers.getSigners()
        deadline = now()+ 86400 // 1 day
        toTokenContract = new ethers.Contract(toToken, Token[blockchain]['20'], wallets[0])
      })

      it('deploys router successfully', async ()=> {
        router = await deploy()
      })

      it('pays NATIVE into the receiver contract', async ()=> {

        
        
      })

      // describe(`with conversion on ${exchange.name}`, ()=> {

      //   it('approves exchange contract to enable converting payments', async ()=> {
      //     await router.connect(wallets[0]).approve(Web3Exchanges[exchange.name][blockchain].router.address)
      //     if(Web3Exchanges[exchange.name][blockchain].smartRouter) {
      //       await router.connect(wallets[0]).approve(Web3Exchanges[exchange.name][blockchain].smartRouter.address)
      //     }
      //   })

      //   it('converts NATIVE to TOKEN via exchanges as part of the payment', async ()=>{

      //     const paymentAmount = 9
      //     const paymentAmountBN = ethers.utils.parseUnits(paymentAmount.toString(), toDecimals)
      //     const feeAmount = 1
      //     const feeAmountBN = ethers.utils.parseUnits(feeAmount.toString(), toDecimals)
      //     const totalAmount = paymentAmount + feeAmount

      //     const route = await Web3Exchanges[exchange.name].route({
      //       blockchain,
      //       tokenIn: Web3Blockchains[blockchain].currency.address,
      //       tokenOut: toToken,
      //       amountOutMin: totalAmount
      //     })

      //     const transaction = await route.getTransaction({ account: router.address, inputTokenPushed: exchange.type === 'push' })
      //     const callData = getCallData({
      //       address: transaction.to,
      //       api: transaction.api,
      //       provider: wallets[0],
      //       method: transaction.method,
      //       params: transaction.params,
      //     })

      //     const paymentReceiverBalanceBefore = await toTokenContract.balanceOf(wallets[1].address)
      //     const feeReceiverBalanceBefore = await toTokenContract.balanceOf(wallets[2].address)

      //     await router.connect(fromAccount).pay(
      //       [ // amounts
      //         route.amountIn, // amountIn
      //         paymentAmountBN, // paymentAmount
      //         feeAmountBN // feeAmount
      //       ],
      //       [ // addresses
      //         route.tokenIn, // tokenIn
      //         transaction.to, // exchangeAddress
      //         route.tokenOut, // tokenOut
      //         wallets[1].address, // paymentReceiver
      //         wallets[2].address, // feeReceiver
      //       ],
      //       [ // types
      //         exchange.type === 'pull' ? 1 : 2
      //       ],
      //       [ // calls
      //         callData, // exchangeCall
      //       ],
      //       deadline, // deadline,
      //       { value: route.amountIn }
      //     )

      //     const paymentReceiverBalanceAfter = await toTokenContract.balanceOf(wallets[1].address)
      //     const feeReceiverBalanceAfter = await toTokenContract.balanceOf(wallets[2].address)

      //     expect(paymentReceiverBalanceAfter).to.eq(paymentReceiverBalanceBefore.add(paymentAmountBN))
      //     expect(feeReceiverBalanceAfter).to.eq(feeReceiverBalanceBefore.add(feeAmountBN))
      //   })
      // })
    })
  })
}

