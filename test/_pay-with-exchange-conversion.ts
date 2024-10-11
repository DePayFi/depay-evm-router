import deploy from './_helpers/deploy'
import getCallData from './_helpers/callData'
import impersonate from './_helpers/impersonate'
import now from './_helpers/now'
import Token from '@depay/web3-tokens-evm'
import Blockchains from '@depay/web3-blockchains'
import Exchanges from '@depay/web3-exchanges-evm'
import { ethers } from 'hardhat'
import { expect } from 'chai'

export default ({ blockchain, fromToken, fromAccount, toToken, exchanges })=>{

  const NATIVE = Blockchains[blockchain].currency.address
  const WRAPPED = Blockchains[blockchain].wrapped.address
  const ZERO = Blockchains[blockchain].zero
  const provider = ethers.provider
  const FROM_ACCOUNT_ADDRESS = fromAccount
  const PAY = 'pay((uint256,uint256,uint256,uint256,uint256,address,address,address,address,address,uint8,uint8,bool,bytes,bytes))'

  describe(`DePayRouterV3 on ${blockchain}`, ()=> {

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
          deadline = (now()+3600) * 1000 // 1 hour in milliseconds
          fromTokenContract = new ethers.Contract(fromToken, Token[blockchain]['20'], wallets[0])
          toTokenContract = new ethers.Contract(toToken, Token[blockchain]['20'], wallets[0])
          if(typeof fromAccount === 'undefined') { fromAccount = await impersonate(FROM_ACCOUNT_ADDRESS) }
        })

        it('deploys router successfully', async ()=> {
          router = await deploy()
        })

        it('fails if trying to convert through a not permitted exchange', async ()=>{

          await expect(
            router.connect(fromAccount)[PAY]({
              amountIn: 1,
              paymentAmount: 1,
              feeAmount: 1,
              protocolAmount: 0,
              tokenInAddress: Blockchains[blockchain].currency.address,
              exchangeAddress: Exchanges[exchange.name][blockchain].router.address,
              tokenOutAddress: Blockchains[blockchain].currency.address,
              paymentReceiverAddress: wallets[1].address,
              feeReceiverAddress: wallets[2].address,
              exchangeType: 0,
              receiverType: 0,
              exchangeCallData: ZERO,
              receiverCallData: ZERO,
              deadline,
            },{ value: 1 })
          ).to.be.revertedWith(
            'ExchangeNotApproved()'
          )
        })

        it('approves exchange contract to enable converting payments', async ()=> {
          await router.connect(wallets[0]).enable(Exchanges[exchange.name][blockchain].router.address, true)
          if(Exchanges[exchange.name][blockchain].smartRouter) {
            await router.connect(wallets[0]).enable(Exchanges[exchange.name][blockchain].smartRouter.address, true)
          }
        })

        describe('using token approvals', ()=> {

          it('requires token approval for the router', async ()=>{
            await fromTokenContract.connect(fromAccount).approve(router.address, Blockchains[blockchain].maxInt)
          })
       
          it('fails if balanceOut is less after payment', async()=>{

            const paymentAmount = 0.1
            const paymentAmountBN = ethers.utils.parseUnits(paymentAmount.toString(), Blockchains[blockchain].currency.decimals)
            const feeAmount = 0.01
            const feeAmountBN = ethers.utils.parseUnits(feeAmount.toString(), Blockchains[blockchain].currency.decimals)
            const totalAmount = paymentAmount + feeAmount

            await wallets[0].sendTransaction({ to: router.address, value: ethers.BigNumber.from("100000000000000000") });

            const route = await Exchanges[exchange.name].route({
              blockchain,
              tokenIn: fromToken,
              tokenOut: Blockchains[blockchain].currency.address,
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
              router.connect(fromAccount)[PAY]({
                amountIn: route.amountIn,
                paymentAmount: paymentAmountBN,
                feeAmount: feeAmountBN.add(ethers.BigNumber.from("100000000000000000")),
                protocolAmount: 0,
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
              'InsufficientBalanceOutAfterPayment()'
            )
          })

          it('converts TOKEN to NATIVE via exchange as part of the payment', async ()=>{

            const paymentAmount = 0.1
            const paymentAmountBN = ethers.utils.parseUnits(paymentAmount.toString(), Blockchains[blockchain].currency.decimals)
            const feeAmount = 0.01
            const feeAmountBN = ethers.utils.parseUnits(feeAmount.toString(), Blockchains[blockchain].currency.decimals)
            const totalAmount = paymentAmount + feeAmount

            const route = await Exchanges[exchange.name].route({
              blockchain,
              tokenIn: fromToken,
              tokenOut: Blockchains[blockchain].currency.address,
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

            await router.connect(fromAccount)[PAY]({
              amountIn: ethers.BigNumber.from(route.amountIn).add(ethers.BigNumber.from("21")),
              paymentAmount: paymentAmountBN,
              feeAmount: feeAmountBN,
              protocolAmount: 0,
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

          it('emits Payment event for TOKEN to NATIVE payments', async ()=>{

            const paymentAmount = 0.1
            const paymentAmountBN = ethers.utils.parseUnits(paymentAmount.toString(), Blockchains[blockchain].currency.decimals)
            const feeAmount = 0.01
            const feeAmountBN = ethers.utils.parseUnits(feeAmount.toString(), Blockchains[blockchain].currency.decimals)
            const totalAmount = paymentAmount + feeAmount

            const route = await Exchanges[exchange.name].route({
              blockchain,
              tokenIn: fromToken,
              tokenOut: Blockchains[blockchain].currency.address,
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
              router.connect(fromAccount)[PAY]({
                amountIn: ethers.BigNumber.from(route.amountIn).add(ethers.BigNumber.from("21")),
                paymentAmount: paymentAmountBN,
                feeAmount: feeAmountBN,
                protocolAmount: 0,
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
            )
            .to.emit(router, 'Payment').withArgs(
              fromAccount._address, // from
              wallets[1].address, // to
              deadline, // deadline
              ethers.BigNumber.from(route.amountIn).add(ethers.BigNumber.from("21")),
              paymentAmountBN,
              feeAmountBN,
              0,
              (amount) => {
                expect(amount).to.be.closeTo(
                  paymentAmountBN.add(feeAmountBN).mul(5).div(1000), // slippage
                  paymentAmountBN.add(feeAmountBN).mul(1).div(10000) // tollerance
                )
              },
              route.tokenIn,
              route.tokenOut,
              wallets[2].address
            )
            
          })

          it('keeps continue converting TOKEN to NATIVE and does not get stuck with safeApprove (non zero)', async ()=>{

            const paymentAmount = 0.1
            const paymentAmountBN = ethers.utils.parseUnits(paymentAmount.toString(), Blockchains[blockchain].currency.decimals)
            const feeAmount = 0.01
            const feeAmountBN = ethers.utils.parseUnits(feeAmount.toString(), Blockchains[blockchain].currency.decimals)
            const totalAmount = paymentAmount + feeAmount

            const route = await Exchanges[exchange.name].route({
              blockchain,
              tokenIn: fromToken,
              tokenOut: Blockchains[blockchain].currency.address,
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

            await router.connect(fromAccount)[PAY]({
              amountIn: route.amountIn,
              paymentAmount: paymentAmountBN,
              feeAmount: feeAmountBN,
              protocolAmount: 0,
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

          it('fails if NATIVE conversion via exchanges misses calldata', async ()=>{

            const paymentAmount = 9
            const paymentAmountBN = ethers.utils.parseUnits(paymentAmount.toString(), toDecimals)
            const feeAmount = 1
            const feeAmountBN = ethers.utils.parseUnits(feeAmount.toString(), toDecimals)
            const totalAmount = paymentAmount + feeAmount

            const route = await Exchanges[exchange.name].route({
              blockchain,
              tokenIn: Blockchains[blockchain].currency.address,
              tokenOut: toToken,
              amountOutMin: totalAmount
            })

            const transaction = await route.getTransaction({ account: router.address, inputTokenPushed: exchange.type === 'push' })
            const callData = [] // empty

            const paymentReceiverBalanceBefore = await toTokenContract.balanceOf(wallets[1].address)
            const feeReceiverBalanceBefore = await toTokenContract.balanceOf(wallets[2].address)

            await expect(
              router.connect(fromAccount)[PAY]({
                amountIn: route.amountIn,
                paymentAmount: paymentAmountBN,
                feeAmount: feeAmountBN,
                protocolAmount: 0,
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
            ).to.be.revertedWith(
              'ExchangeCallMissing'
            )
          })

          it('converts NATIVE to TOKEN via exchanges as part of the payment', async ()=>{

            const paymentAmount = 9
            const paymentAmountBN = ethers.utils.parseUnits(paymentAmount.toString(), toDecimals)
            const feeAmount = 1
            const feeAmountBN = ethers.utils.parseUnits(feeAmount.toString(), toDecimals)
            const totalAmount = paymentAmount + feeAmount

            const route = await Exchanges[exchange.name].route({
              blockchain,
              tokenIn: Blockchains[blockchain].currency.address,
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

            await router.connect(fromAccount)[PAY]({
              amountIn: route.amountIn,
              paymentAmount: paymentAmountBN,
              feeAmount: feeAmountBN,
              protocolAmount: 0,
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

          it('emits Payment event for NATIVE to TOKEN payment', async ()=>{

            const paymentAmount = 9
            const paymentAmountBN = ethers.utils.parseUnits(paymentAmount.toString(), toDecimals)
            const feeAmount = 1
            const feeAmountBN = ethers.utils.parseUnits(feeAmount.toString(), toDecimals)
            const totalAmount = paymentAmount + feeAmount

            const route = await Exchanges[exchange.name].route({
              blockchain,
              tokenIn: Blockchains[blockchain].currency.address,
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

            await expect(
              await router.connect(fromAccount)[PAY]({
                amountIn: route.amountIn,
                paymentAmount: paymentAmountBN,
                feeAmount: feeAmountBN,
                protocolAmount: 0,
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
            )
            .to.emit(router, 'Payment').withArgs(
              fromAccount._address, // from
              wallets[1].address, // to
              deadline, // deadline
              route.amountIn,
              paymentAmountBN,
              feeAmountBN,
              0,
              (amount) => {
                expect(amount).to.be.closeTo(
                  paymentAmountBN.add(feeAmountBN).mul(5).div(1000), // slippage
                  paymentAmountBN.add(feeAmountBN).mul(1).div(10000) // tollerance
                )
              },
              route.tokenIn,
              route.tokenOut,
              wallets[2].address
            )
          })

          it('keeps protocol amount and calculates slippageAmount accordingly', async ()=>{

            const paymentAmount = 9
            const paymentAmountBN = ethers.utils.parseUnits(paymentAmount.toString(), toDecimals)
            const feeAmount = 1
            const feeAmountBN = ethers.utils.parseUnits(feeAmount.toString(), toDecimals)
            const protocolAmount = 1
            const protocolAmountBN = ethers.utils.parseUnits(feeAmount.toString(), toDecimals)
            const totalAmount = paymentAmount + feeAmount + protocolAmount

            const route = await Exchanges[exchange.name].route({
              blockchain,
              tokenIn: Blockchains[blockchain].currency.address,
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

            await expect(
              await router.connect(fromAccount)[PAY]({
                amountIn: route.amountIn,
                paymentAmount: paymentAmountBN,
                feeAmount: feeAmountBN,
                protocolAmount: protocolAmountBN,
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
            )
            .to.emit(router, 'Payment').withArgs(
              fromAccount._address, // from
              wallets[1].address, // to
              deadline, // deadline
              route.amountIn,
              paymentAmountBN,
              feeAmountBN,
              protocolAmountBN,
              (amount) => {
                expect(amount).to.be.closeTo(
                  paymentAmountBN.add(feeAmountBN).sub(protocolAmountBN).mul(5).div(1000), // slippage
                  paymentAmountBN.add(feeAmountBN).sub(protocolAmountBN).mul(1).div(10000) // tollerance
                )
              },
              route.tokenIn,
              route.tokenOut,
              wallets[2].address
            )
          })

          it('converts TOKEN to TOKEN via exchanges as part of the payment', async ()=>{

            const paymentAmount = 9
            const paymentAmountBN = ethers.utils.parseUnits(paymentAmount.toString(), toDecimals)
            const feeAmount = 1
            const feeAmountBN = ethers.utils.parseUnits(feeAmount.toString(), toDecimals)
            const totalAmount = paymentAmount + feeAmount

            const route = await Exchanges[exchange.name].route({
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

            await router.connect(fromAccount)[PAY]({
              amountIn: route.amountIn,
              paymentAmount: paymentAmountBN,
              feeAmount: feeAmountBN,
              protocolAmount: 0,
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

