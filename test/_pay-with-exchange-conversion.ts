import deploy from './_helpers/deploy'
import getCallData from './_helpers/callData'
import impersonate from './_helpers/impersonate'
import now from './_helpers/now'
import Token from '@depay/web3-tokens-evm'
import Web3Blockchains from '@depay/web3-blockchains'
import Web3Exchanges from '@depay/web3-exchanges-evm'
import { ethers } from 'hardhat'
import { expect } from 'chai'

export default ({ blockchain, fromToken, fromAccount, toToken, exchanges })=>{

  const NATIVE = Web3Blockchains[blockchain].currency.address
  const WRAPPED = Web3Blockchains[blockchain].wrapped.address
  const ZERO = Web3Blockchains[blockchain].zero
  const provider = ethers.provider
  const FROM_ACCOUNT_ADDRESS = fromAccount

  describe(`DePayRouterV2 on ${blockchain}`, ()=> {

    exchanges.map((exchange)=>{

      describe(`pay with exchange conversion on ${exchange.name}`, ()=> {

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
          fromTokenContract = new ethers.Contract(fromToken, Token[blockchain]['20'], wallets[0])
          toTokenContract = new ethers.Contract(toToken, Token[blockchain]['20'], wallets[0])
          if(typeof fromAccount === 'undefined') { fromAccount = await impersonate(FROM_ACCOUNT_ADDRESS) }
        })

        it('deploys router successfully', async ()=> {
          router = await deploy()
        })

        it('fails if trying to convert through a not permitted exchange', async ()=>{

          await expect(
            router.connect(fromAccount).pay({
              amountIn: 1,
              paymentAmount: 1,
              feeAmount: 1,
              tokenInAddress: Web3Blockchains[blockchain].currency.address,
              exchangeAddress: Web3Exchanges[exchange.name][blockchain].router.address,
              tokenOutAddress: Web3Blockchains[blockchain].currency.address,
              paymentReceiverAddress: wallets[1].address,
              feeReceiverAddress: wallets[2].address,
              exchangeType: 0,
              receiverType: 0,
              exchangeCallData: ZERO,
              receiverCallData: ZERO,
              deadline,
            },{ value: 1 })
          ).to.be.revertedWith(
            'DePay: Exchange has not been approved!'
          )
        })

        it('approves exchange contract to enable converting payments', async ()=> {
          await router.connect(wallets[0]).approve(Web3Exchanges[exchange.name][blockchain].router.address)
          if(Web3Exchanges[exchange.name][blockchain].smartRouter) {
            await router.connect(wallets[0]).approve(Web3Exchanges[exchange.name][blockchain].smartRouter.address)
          }
        })

        describe('using permit2', ()=> { // needs to be tested prior to token approvals being stored/tested
          
        })

        describe('using token approvals', ()=> {

          it('requires token approval for the router', async ()=>{
            await fromTokenContract.connect(fromAccount).approve(router.address, Web3Blockchains[blockchain].maxInt)
          })
       
          it('fails if balanceOut is less after payment', async()=>{

            const paymentAmount = 9
            const paymentAmountBN = ethers.utils.parseUnits(paymentAmount.toString(), Web3Blockchains[blockchain].currency.decimals)
            const feeAmount = 1
            const feeAmountBN = ethers.utils.parseUnits(feeAmount.toString(), Web3Blockchains[blockchain].currency.decimals)
            const totalAmount = paymentAmount + feeAmount

            await wallets[0].sendTransaction({ to: router.address, value: ethers.BigNumber.from("100000000000000000") });

            const route = await Web3Exchanges[exchange.name].route({
              blockchain,
              tokenIn: fromToken,
              tokenOut: Web3Blockchains[blockchain].currency.address,
              amountOutMin: totalAmount
            })

            const transaction = await route.getTransaction({ account: router.address, inputTokenPushed: exchange.type === 'push' })
            const callData = getCallData({
              address: transaction.to,
              api: transaction.api,
              provider: wallets[0],
              method: transaction.method,
              params: transaction.params,
            })

            const paymentReceiverBalanceBefore = await provider.getBalance(wallets[1].address)
            const feeReceiverBalanceBefore = await provider.getBalance(wallets[2].address)

            await expect(
              router.connect(fromAccount).pay({
                amountIn: route.amountIn,
                paymentAmount: paymentAmountBN,
                feeAmount: feeAmountBN.add(ethers.BigNumber.from("100000000000000000")),
                tokenInAddress: route.tokenIn,
                exchangeAddress: transaction.to,
                tokenOutAddress: route.tokenOut,
                paymentReceiverAddress: wallets[1].address,
                feeReceiverAddress: wallets[2].address,
                exchangeType: exchange.type === 'pull' ? 1 : 2,
                receiverType: 0,
                exchangeCallData: callData,
                receiverCallData: ZERO,
                deadline,
              })
            ).to.be.revertedWith(
              'DePay: Insufficient balanceOut after payment!'
            )
          })

          it('converts TOKEN to NATIVE via exchange as part of the payment', async ()=>{

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

            const transaction = await route.getTransaction({ account: router.address, inputTokenPushed: exchange.type === 'push' })
            const callData = getCallData({
              address: transaction.to,
              api: transaction.api,
              provider: wallets[0],
              method: transaction.method,
              params: transaction.params,
            })

            const paymentReceiverBalanceBefore = await provider.getBalance(wallets[1].address)
            const feeReceiverBalanceBefore = await provider.getBalance(wallets[2].address)

            await router.connect(fromAccount).pay({
              amountIn: route.amountIn,
              paymentAmount: paymentAmountBN,
              feeAmount: feeAmountBN,
              tokenInAddress: route.tokenIn,
              exchangeAddress: transaction.to,
              tokenOutAddress: route.tokenOut,
              paymentReceiverAddress: wallets[1].address,
              feeReceiverAddress: wallets[2].address,
              exchangeType: exchange.type === 'pull' ? 1 : 2,
              receiverType: 0,
              exchangeCallData: callData,
              receiverCallData: ZERO,
              deadline,
            })

            const paymentReceiverBalanceAfter = await provider.getBalance(wallets[1].address)
            const feeReceiverBalanceAfter = await provider.getBalance(wallets[2].address)

            expect(paymentReceiverBalanceAfter).to.eq(paymentReceiverBalanceBefore.add(paymentAmountBN))
            expect(feeReceiverBalanceAfter).to.eq(feeReceiverBalanceBefore.add(feeAmountBN))
          })

          it('converts NATIVE to TOKEN via exchanges as part of the payment', async ()=>{

            const paymentAmount = 9
            const paymentAmountBN = ethers.utils.parseUnits(paymentAmount.toString(), toDecimals)
            const feeAmount = 1
            const feeAmountBN = ethers.utils.parseUnits(feeAmount.toString(), toDecimals)
            const totalAmount = paymentAmount + feeAmount

            const route = await Web3Exchanges[exchange.name].route({
              blockchain,
              tokenIn: Web3Blockchains[blockchain].currency.address,
              tokenOut: toToken,
              amountOutMin: totalAmount
            })

            const transaction = await route.getTransaction({ account: router.address, inputTokenPushed: exchange.type === 'push' })
            const callData = getCallData({
              address: transaction.to,
              api: transaction.api,
              provider: wallets[0],
              method: transaction.method,
              params: transaction.params,
            })

            const paymentReceiverBalanceBefore = await toTokenContract.balanceOf(wallets[1].address)
            const feeReceiverBalanceBefore = await toTokenContract.balanceOf(wallets[2].address)

            await router.connect(fromAccount).pay({
              amountIn: route.amountIn,
              paymentAmount: paymentAmountBN,
              feeAmount: feeAmountBN,
              tokenInAddress: route.tokenIn,
              exchangeAddress: transaction.to,
              tokenOutAddress: route.tokenOut,
              paymentReceiverAddress: wallets[1].address,
              feeReceiverAddress: wallets[2].address,
              exchangeType: exchange.type === 'pull' ? 1 : 2,
              receiverType: 0,
              exchangeCallData: callData,
              receiverCallData: ZERO,
              deadline,
            }, { value: route.amountIn })

            const paymentReceiverBalanceAfter = await toTokenContract.balanceOf(wallets[1].address)
            const feeReceiverBalanceAfter = await toTokenContract.balanceOf(wallets[2].address)

            expect(paymentReceiverBalanceAfter).to.eq(paymentReceiverBalanceBefore.add(paymentAmountBN))
            expect(feeReceiverBalanceAfter).to.eq(feeReceiverBalanceBefore.add(feeAmountBN))
          })

          it('converts TOKEN to TOKEN via exchanges as part of the payment', async ()=>{

            const paymentAmount = 9
            const paymentAmountBN = ethers.utils.parseUnits(paymentAmount.toString(), toDecimals)
            const feeAmount = 1
            const feeAmountBN = ethers.utils.parseUnits(feeAmount.toString(), toDecimals)
            const totalAmount = paymentAmount + feeAmount

            const route = await Web3Exchanges[exchange.name].route({
              blockchain,
              tokenIn: fromToken,
              tokenOut: toToken,
              amountOutMin: totalAmount
            })

            const transaction = await route.getTransaction({ account: router.address, inputTokenPushed: exchange.type === 'push' })
            const callData = getCallData({
              address: transaction.to,
              api: transaction.api,
              provider: wallets[0],
              method: transaction.method,
              params: transaction.params,
            })

            const paymentReceiverBalanceBefore = await toTokenContract.balanceOf(wallets[1].address)
            const feeReceiverBalanceBefore = await toTokenContract.balanceOf(wallets[2].address)

            await router.connect(fromAccount).pay({
              amountIn: route.amountIn,
              paymentAmount: paymentAmountBN,
              feeAmount: feeAmountBN,
              tokenInAddress: route.tokenIn,
              exchangeAddress: transaction.to,
              tokenOutAddress: route.tokenOut,
              paymentReceiverAddress: wallets[1].address,
              feeReceiverAddress: wallets[2].address,
              exchangeType: exchange.type === 'pull' ? 1 : 2,
              receiverType: 0,
              exchangeCallData: callData,
              receiverCallData: ZERO,
              deadline,
            })

            const paymentReceiverBalanceAfter = await toTokenContract.balanceOf(wallets[1].address)
            const feeReceiverBalanceAfter = await toTokenContract.balanceOf(wallets[2].address)

            expect(paymentReceiverBalanceAfter).to.eq(paymentReceiverBalanceBefore.add(paymentAmountBN))
            expect(feeReceiverBalanceAfter).to.eq(feeReceiverBalanceBefore.add(feeAmountBN))
          })
        })
      })
    })
  })
}

