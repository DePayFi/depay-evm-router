import deployRouter from './_helpers/deploy/router'
import getCallData from './_helpers/callData'
import impersonate from './_helpers/impersonate'
import now from './_helpers/now'
import Token from '@depay/web3-tokens-evm'
import Web3Blockchains from '@depay/web3-blockchains'
import Web3Exchanges from '@depay/web3-exchanges-evm'
import { ethers } from 'hardhat'
import { expect } from 'chai'

export default ({ blockchain, fromToken, fromAccount, exchanges })=>{

  const NATIVE = Web3Blockchains[blockchain].currency.address
  const WRAPPED = Web3Blockchains[blockchain].wrapped.address
  const ZERO = Web3Blockchains[blockchain].zero
  const provider = ethers.provider
  const FROM_ACCOUNT_ADDRESS = fromAccount

  describe(`DePayRouterV2 on ${blockchain}`, ()=> {

    describe(`pay with exchange conversion`, ()=> {

      let wallets
      let router
      let deadline
      let fromTokenContract
      let fromAccount

      beforeEach(async ()=>{
        wallets = await ethers.getSigners()
        deadline = now()+ 86400 // 1 day
        fromTokenContract = new ethers.Contract(fromToken, Token[blockchain]['20'], wallets[0])
        if(typeof fromAccount === 'undefined') { fromAccount = await impersonate(FROM_ACCOUNT_ADDRESS) }
      })

      it('deploys router successfully', async ()=> {
        router = await deployRouter({ WRAPPED })
      })

      it('approves exchange contracts as exchange to convert payments', async ()=> {
        await Promise.all(exchanges.map(async (exchange)=>{
          await router.connect(wallets[0]).approve(Web3Exchanges[exchange.name][blockchain].router.address)
        }))
      })

      describe('not permitted exchanges', ()=> {

        it('fails if trying to convert through a not permitted exchange', async ()=>{

          await expect(
            router.connect(fromAccount).pay(
              [ // amounts
                1, // amountIn
                1, // paymentAmount
                1 // feeAmount
              ],
              [ // addresses
                Web3Blockchains[blockchain].currency.address, // tokenIn
                "0x5a75a093747b72a0e14056352751edf03518031d", // exchangeAddress
                Web3Blockchains[blockchain].currency.address, // tokenOut
                wallets[1].address, // paymentReceiver
                wallets[2].address, // feeReceiver
              ],
              [0], // types
              [ // calls
                Web3Blockchains[blockchain].zero, // exchangeCall
              ],
              deadline, // deadline
              { value: 1 }
            )
          ).to.be.revertedWith(
            'DePay: Exchange has not been approved!'
          )
        })
      })

      describe('using permit2', ()=> {
      })

      describe('using token approvals', ()=> {

        beforeEach(async()=>{
          await fromTokenContract.connect(fromAccount).approve(router.address, Web3Blockchains[blockchain].maxInt)
        })

        describe('TOKEN to NATIVE', ()=>{

          it('converts TOKEN to NATIVE via exchanges as part of the payment', async ()=>{

            await Promise.all(exchanges.map(async (exchange)=>{

              const paymentAmount = 9
              const paymentAmountBN = ethers.utils.parseUnits(paymentAmount.toString(), Web3Blockchains[blockchain].currency.decimals)
              const feeAmount = 1
              const feeAmountBN = ethers.utils.parseUnits(feeAmount.toString(), Web3Blockchains[blockchain].currency.decimals)
              const totalAmount = paymentAmount + feeAmount

              const route = await Web3Exchanges[exchange.name].route({
                blockchain,
                tokenIn: fromToken,
                tokenOut: Web3Blockchains[blockchain].currency.address,
                amountOutMin: totalAmount
              })

              const transaction = await route.getTransaction({ account: router.address, inputTokenPushed: true })
              const callData = getCallData({
                address: transaction.to,
                api: transaction.api,
                provider: wallets[0],
                method: transaction.method,
                params: transaction.params,
              })

              const paymentReceiverBalanceBefore = await provider.getBalance(wallets[1].address)
              const feeReceiverBalanceBefore = await provider.getBalance(wallets[2].address)

              await router.connect(fromAccount).pay(
                [ // amounts
                  route.amountIn, // amountIn
                  paymentAmountBN, // paymentAmount
                  feeAmountBN // feeAmount
                ],
                [ // addresses
                  route.tokenIn, // tokenIn
                  transaction.to, // exchangeAddress
                  route.tokenOut, // tokenOut
                  wallets[1].address, // paymentReceiver
                  wallets[2].address, // feeReceiver
                ],
                [ // types
                  exchange.type === 'pull' ? 1 : 2
                ],
                [ // calls
                  callData, // exchangeCall
                ],
                deadline, // deadline
              )

              const paymentReceiverBalanceAfter = await provider.getBalance(wallets[1].address)
              const feeReceiverBalanceAfter = await provider.getBalance(wallets[2].address)

              expect(paymentReceiverBalanceAfter).to.eq(paymentReceiverBalanceBefore.add(paymentAmountBN))
              expect(feeReceiverBalanceAfter).to.eq(feeReceiverBalanceBefore.add(feeAmountBN))
            }))
          })
        })
      })
    })
  })
}
