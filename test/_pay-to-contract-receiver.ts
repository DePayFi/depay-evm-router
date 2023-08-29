import deploy from './_helpers/deploy'
import deployTestReceiver from './_helpers/deployTestReceiver'
import getCallData from './_helpers/callData'
import impersonate from './_helpers/impersonate'
import now from './_helpers/now'
import Token from '@depay/web3-tokens-evm'
import Blockchains from '@depay/web3-blockchains'
import Exchanges from '@depay/web3-exchanges-evm'
import { ethers } from 'hardhat'
import { expect } from 'chai'

export default ({ blockchain, fromToken, fromAccount, toToken, exchange })=>{

  const NATIVE = Blockchains[blockchain].currency.address
  const WRAPPED = Blockchains[blockchain].wrapped.address
  const ZERO = Blockchains[blockchain].zero
  const provider = ethers.provider
  const FROM_ACCOUNT_ADDRESS = fromAccount
  const PAY = 'pay((uint256,bool,uint256,uint256,address,address,address,address,address,uint8,uint8,bytes,bytes,uint256))'

  describe(`DePayRouterV2 on ${blockchain}`, ()=> {

    describe(`pay to contract receiver`, ()=> {

      let wallets
      let router
      let receiverContract
      let deadline
      let fromTokenContract
      let fromAccount
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

      it('requires a receiver contract', async ()=> {
        router = await deploy()
      })

      it('deploys router successfully', async ()=> {
        receiverContract = await deployTestReceiver()
      })

      it('pays NATIVE into the receiver contract (push only)', async ()=> {

        const paymentAmount = 900000000
        const feeAmount = 100000000
        const amountIn = paymentAmount + feeAmount
        
        const callData = receiverContract.interface.encodeFunctionData("receiveNative", [ethers.BigNumber.from(paymentAmount)])

        const paymentReceiverBalanceBefore = await provider.getBalance(receiverContract.address)
        const feeReceiverBalanceBefore = await provider.getBalance(wallets[2].address)

        await expect(
          router.connect(wallets[0])[PAY]({
            amountIn,
            paymentAmount,
            feeAmount,
            tokenInAddress: NATIVE,
            exchangeAddress: ZERO,
            tokenOutAddress: NATIVE,
            paymentReceiverAddress: receiverContract.address,
            feeReceiverAddress: wallets[2].address,
            exchangeType: 0,
            receiverType: 2,
            exchangeCallData: ZERO,
            receiverCallData: callData,
            deadline,
          }, { value: amountIn })
        )
        .to.emit(router, 'Transfer').withArgs(wallets[0].address, wallets[2].address, feeAmount)
        .to.emit(router, 'Transfer').withArgs(wallets[0].address, receiverContract.address, paymentAmount)
        .to.emit(receiverContract, 'Received').withArgs(paymentAmount, paymentAmount)

        const paymentReceiverBalanceAfter = await provider.getBalance(receiverContract.address)
        const feeReceiverBalanceAfter = await provider.getBalance(wallets[2].address)

        expect(paymentReceiverBalanceAfter).to.eq(paymentReceiverBalanceBefore.add(paymentAmount))
        expect(feeReceiverBalanceAfter).to.eq(feeReceiverBalanceBefore.add(feeAmount))
      })

      it('pays TOKEN into the receiver contract (push)', async ()=> {

        const amountIn = 1000000000
        const paymentAmount = 900000000
        const feeAmount = 100000000

        const paymentReceiverBalanceBefore = await fromTokenContract.balanceOf(wallets[1].address)
        const feeReceiverBalanceBefore = await fromTokenContract.balanceOf(wallets[2].address)

        await fromTokenContract.connect(fromAccount).approve(router.address, amountIn)

        const callData = receiverContract.interface.encodeFunctionData("receivePushToken", [fromToken, ethers.BigNumber.from(paymentAmount)])

        await expect(
          router.connect(fromAccount)[PAY]({
            amountIn: amountIn,
            paymentAmount: paymentAmount,
            feeAmount: feeAmount,
            tokenInAddress: fromToken,
            exchangeAddress: ZERO,
            tokenOutAddress: fromToken,
            paymentReceiverAddress: receiverContract.address,
            feeReceiverAddress: wallets[2].address,
            exchangeType: 0,
            receiverType: 2,
            exchangeCallData: ZERO,
            receiverCallData: callData,
            deadline,
          })
        ).to.emit(receiverContract, 'Received').withArgs(paymentAmount, paymentAmount)

        const paymentReceiverBalanceAfter = await fromTokenContract.balanceOf(receiverContract.address)
        const feeReceiverBalanceAfter = await fromTokenContract.balanceOf(wallets[2].address)

        expect(paymentReceiverBalanceAfter).to.eq(paymentReceiverBalanceBefore.add(paymentAmount))
        expect(feeReceiverBalanceAfter).to.eq(feeReceiverBalanceBefore.add(feeAmount))
      })

      it('reverts if user attempts to pull NATIVE into the receiver contract', async ()=> {

        const paymentAmount = 900000000
        const feeAmount = 100000000
        const amountIn = paymentAmount + feeAmount
        
        const callData = receiverContract.interface.encodeFunctionData("receiveNative", [ethers.BigNumber.from(paymentAmount)])

        const paymentReceiverBalanceBefore = await provider.getBalance(receiverContract.address)
        const feeReceiverBalanceBefore = await provider.getBalance(wallets[2].address)

        await expect(
          router.connect(wallets[0])[PAY]({
            amountIn,
            paymentAmount,
            feeAmount,
            tokenInAddress: NATIVE,
            exchangeAddress: ZERO,
            tokenOutAddress: NATIVE,
            paymentReceiverAddress: receiverContract.address,
            feeReceiverAddress: wallets[2].address,
            exchangeType: 0,
            receiverType: 1,
            exchangeCallData: ZERO,
            receiverCallData: callData,
            deadline,
          }, { value: amountIn })
        ).to.be.revertedWith(
          'NaitvePullNotSupported()'
        )
      })

      it('pays TOKEN into the receiver contract (pull)', async ()=> {

        const amountIn = 1000000000
        const paymentAmount = 900000000
        const feeAmount = 100000000

        const paymentReceiverBalanceBefore = await fromTokenContract.balanceOf(receiverContract.address)
        const feeReceiverBalanceBefore = await fromTokenContract.balanceOf(wallets[2].address)

        await fromTokenContract.connect(fromAccount).approve(router.address, amountIn)

        const callData = receiverContract.interface.encodeFunctionData("receivePullToken", [fromToken, ethers.BigNumber.from(paymentAmount)])

        await expect(
          router.connect(fromAccount)[PAY]({
            amountIn: amountIn,
            paymentAmount: paymentAmount,
            feeAmount: feeAmount,
            tokenInAddress: fromToken,
            exchangeAddress: ZERO,
            tokenOutAddress: fromToken,
            paymentReceiverAddress: receiverContract.address,
            feeReceiverAddress: wallets[2].address,
            exchangeType: 0,
            receiverType: 1,
            exchangeCallData: ZERO,
            receiverCallData: callData,
            deadline,
          })
        ).to.emit(receiverContract, 'Received').withArgs(paymentAmount, paymentAmount)

        const paymentReceiverBalanceAfter = await fromTokenContract.balanceOf(receiverContract.address)
        const feeReceiverBalanceAfter = await fromTokenContract.balanceOf(wallets[2].address)

        expect(paymentReceiverBalanceAfter).to.eq(paymentReceiverBalanceBefore.add(paymentAmount))
        expect(feeReceiverBalanceAfter).to.eq(feeReceiverBalanceBefore.add(feeAmount))
      })

      it('pays NATIVE->TOKEN into the receiver contract (pull) after conversion', async ()=> {

        await router.connect(wallets[0]).enable(Exchanges[exchange.name][blockchain].router.address, true)
        if(Exchanges[exchange.name][blockchain].smartRouter) {
          await router.connect(wallets[0]).enable(Exchanges[exchange.name][blockchain].smartRouter.address, true)
        }

        const paymentAmount = 9
        const paymentAmountBN = ethers.utils.parseUnits(paymentAmount.toString(), toDecimals)
        const feeAmount = 1
        const feeAmountBN = ethers.utils.parseUnits(feeAmount.toString(), toDecimals)
        const totalAmount = paymentAmount + feeAmount

        const paymentReceiverBalanceBefore = await toTokenContract.balanceOf(receiverContract.address)
        const feeReceiverBalanceBefore = await toTokenContract.balanceOf(wallets[2].address)

        const receiverCallData = receiverContract.interface.encodeFunctionData("receivePullToken", [toToken, paymentAmountBN])

        const route = await Exchanges[exchange.name].route({
          blockchain,
          tokenIn: Blockchains[blockchain].currency.address,
          tokenOut: toToken,
          amountOutMin: totalAmount
        })

        const transaction = await route.getTransaction({ account: router.address, inputTokenPushed: exchange.type === 'push' })
        const exchangeCallData = getCallData({
          address: transaction.to,
          api: transaction.api,
          provider: wallets[0],
          method: transaction.method,
          params: transaction.params,
        })

        await expect(
          router.connect(wallets[0])[PAY]({
            amountIn: route.amountIn,
            paymentAmount: paymentAmountBN,
            feeAmount: feeAmountBN,
            tokenInAddress: route.tokenIn,
            exchangeAddress: transaction.to,
            tokenOutAddress: route.tokenOut,
            paymentReceiverAddress: receiverContract.address,
            feeReceiverAddress: wallets[2].address,
            exchangeType: exchange.type === 'pull' ? 1 : 2,
            receiverType: 1,
            exchangeCallData,
            receiverCallData,
            deadline,
          }, { value: route.amountIn })
        ).to.emit(receiverContract, 'Received').withArgs(paymentAmountBN, paymentAmountBN)

        const paymentReceiverBalanceAfter = await toTokenContract.balanceOf(receiverContract.address)
        const feeReceiverBalanceAfter = await toTokenContract.balanceOf(wallets[2].address)

        expect(paymentReceiverBalanceAfter).to.eq(paymentReceiverBalanceBefore.add(paymentAmountBN))
        expect(feeReceiverBalanceAfter).to.eq(feeReceiverBalanceBefore.add(feeAmountBN))
      })

      it('does not allow other to stop the forwarder', async ()=> {

        const forwarder = (await ethers.getContractFactory('DePayForwarderV2')).attach(await router.FORWARDER())
        await expect(
          forwarder.connect(wallets[1]).toggle(1)
        ).to.be.revertedWith(
          'Ownable: caller is not the owner'
        )
      })

      it('allows the owner to stop the forwarder', async ()=> {

        const forwarder = (await ethers.getContractFactory('DePayForwarderV2')).attach(await router.FORWARDER())
        await forwarder.connect(wallets[0]).toggle(1)
      })

      it('does not not allow forwarding while the forwarder is stopped', async ()=> {

        const forwarder = (await ethers.getContractFactory('DePayForwarderV2')).attach(await router.FORWARDER())

        await expect(
          router.connect(wallets[0])[PAY]({
            amountIn: 1,
            paymentAmount: 1,
            feeAmount: 1,
            tokenInAddress: NATIVE,
            exchangeAddress: ZERO,
            tokenOutAddress: NATIVE,
            paymentReceiverAddress: receiverContract.address,
            feeReceiverAddress: wallets[2].address,
            exchangeType: 0,
            receiverType: 2,
            exchangeCallData: ZERO,
            receiverCallData: "0x0000000000000000000000000000000000000001",
            deadline,
          }, { value: 1 })
        ).to.be.revertedWith(
          'ForwarderHasBeenStopped()'
        )
      })

      it('allows the owner to reenable the forwarder', async ()=> {

        const forwarder = (await ethers.getContractFactory('DePayForwarderV2')).attach(await router.FORWARDER())
        await forwarder.connect(wallets[0]).toggle(2)
      })

      it('allows forwarding again once the forwarder has been reenabled', async ()=> {
        
        const paymentAmount = 900000000
        const feeAmount = 100000000
        const amountIn = paymentAmount + feeAmount
        
        const callData = receiverContract.interface.encodeFunctionData("receiveNative", [ethers.BigNumber.from(paymentAmount)])

        const paymentReceiverBalanceBefore = await provider.getBalance(receiverContract.address)
        const feeReceiverBalanceBefore = await provider.getBalance(wallets[2].address)

        await expect(
          router.connect(wallets[0])[PAY]({
            amountIn,
            paymentAmount,
            feeAmount,
            tokenInAddress: NATIVE,
            exchangeAddress: ZERO,
            tokenOutAddress: NATIVE,
            paymentReceiverAddress: receiverContract.address,
            feeReceiverAddress: wallets[2].address,
            exchangeType: 0,
            receiverType: 2,
            exchangeCallData: ZERO,
            receiverCallData: callData,
            deadline,
          }, { value: amountIn })
        )
        .to.emit(router, 'Transfer').withArgs(wallets[0].address, wallets[2].address, feeAmount)
        .to.emit(router, 'Transfer').withArgs(wallets[0].address, receiverContract.address, paymentAmount)
        .to.emit(receiverContract, 'Received').withArgs(paymentAmount, paymentAmount)

        const paymentReceiverBalanceAfter = await provider.getBalance(receiverContract.address)
        const feeReceiverBalanceAfter = await provider.getBalance(wallets[2].address)

        expect(paymentReceiverBalanceAfter).to.eq(paymentReceiverBalanceBefore.add(paymentAmount))
        expect(feeReceiverBalanceAfter).to.eq(feeReceiverBalanceBefore.add(feeAmount))
      })
    })
  })
}

