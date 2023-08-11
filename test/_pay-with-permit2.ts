import deploy from './_helpers/deploy'
import impersonate from './_helpers/impersonate'
import now from './_helpers/now'
import Token from '@depay/web3-tokens-evm'
import Blockchains from '@depay/web3-blockchains'
import Exchanges from '@depay/web3-exchanges-evm'
import { request } from '@depay/web3-client-evm'
import { ethers } from 'hardhat'
import { expect } from 'chai'

export default ({ blockchain, token, tokenHolder })=>{

  const NATIVE = Blockchains[blockchain].currency.address
  const WRAPPED = Blockchains[blockchain].wrapped.address
  const TOKEN = token
  const ZERO = Blockchains[blockchain].zero
  const provider = ethers.provider
  const PAY = 'pay((uint256,bool,uint256,uint256,address,address,address,address,address,uint8,uint8,bytes,bytes,uint256))'
  const PAY_WITH_PERMIT2 = 'pay((uint256,bool,uint256,uint256,address,address,address,address,address,uint8,uint8,bytes,bytes,uint256),((address,uint160,uint48,uint48),address,uint256),bytes)'

  describe(`DePayRouterV2 on ${blockchain}`, ()=> {

    describe(`pay with PERMIT2`, ()=> {

      let wallets
      let router
      let deadline
      let tokenContract
      let permit2Contract

      beforeEach(async ()=>{
        wallets = await ethers.getSigners()
        tokenContract = new ethers.Contract(TOKEN, Token[blockchain]['20'], wallets[0])
        if(typeof tokenHolder === 'string') { tokenHolder = await impersonate(tokenHolder) }
        deadline = now()+ 86400 // 1 day
      })

      it('deploys router successfully', async ()=> {
        router = await deploy()
      })

      it('requires permit2', async ()=> {
        permit2Contract = new ethers.Contract(
          await router.PERMIT2(),
          Exchanges.uniswap_v3.ethereum.permit.api,
          wallets[0]
        )
      })

      it('perfoms payment with a valid permit2 signature', async ()=> {

        const amountIn = 1000000000
        const paymentAmount = 900000000
        const feeAmount = 100000000
        const nonce = 0

        await tokenContract.connect(tokenHolder).transfer(wallets[0].address, amountIn) // move tokens from tokenHolder to payment signer

        const domain = {
          chainId: "31337", // hardhat
          name: "Permit2",
          verifyingContract: permit2Contract.address
        }

        const types = {
          PermitSingle: [
            { name: "details", type: "PermitDetails" },
            { name: "spender", type: "address" },
            { name: "sigDeadline", type: "uint256" }
          ],
          PermitDetails: [
            { name: "token", type: "address" },
            { name: "amount", type: "uint160" },
            { name: "expiration", type: "uint48" },
            { name: "nonce", type: "uint48" }
          ]
        }

        const data = {
          details: {
            token: TOKEN,
            amount: "1461501637330902918203684832716283019655932542975", // max uint160 for permit2
            expiration: deadline,
            nonce
          },
          spender: router.address,
          sigDeadline: deadline
        }

        const signature = await wallets[0]._signTypedData(domain, types, data)

        const payment = {
          amountIn,
          permit2: true,
          paymentAmount,
          feeAmount,
          tokenInAddress: TOKEN,
          exchangeAddress: ZERO,
          tokenOutAddress: TOKEN,
          paymentReceiverAddress: wallets[1].address,
          feeReceiverAddress: wallets[2].address,
          exchangeType: 0,
          receiverType: 0,
          exchangeCallData: ZERO,
          receiverCallData: ZERO,
          deadline,
        }


        const paymentReceiverBalanceBefore = await tokenContract.balanceOf(wallets[1].address)
        const feeReceiverBalanceBefore = await tokenContract.balanceOf(wallets[2].address)

        await tokenContract.connect(wallets[0]).approve(permit2Contract.address, Blockchains[blockchain].maxInt) // approve permit2
        await router.connect(wallets[0])[PAY_WITH_PERMIT2](payment, data, signature)

        const paymentReceiverBalanceAfter = await tokenContract.balanceOf(wallets[1].address)
        const feeReceiverBalanceAfter = await tokenContract.balanceOf(wallets[2].address)

        expect(paymentReceiverBalanceAfter).to.eq(paymentReceiverBalanceBefore.add(paymentAmount))
        expect(feeReceiverBalanceAfter).to.eq(feeReceiverBalanceBefore.add(feeAmount))
      })

      it('continues to perfom payments with a stored permit2 allowance', async ()=> {

        const amountIn = 1000000000
        const paymentAmount = 900000000
        const feeAmount = 100000000

        await tokenContract.connect(tokenHolder).transfer(wallets[0].address, amountIn) // move tokens from tokenHolder to payment signer

        const payment = {
          amountIn,
          permit2: true,
          paymentAmount,
          feeAmount,
          tokenInAddress: TOKEN,
          exchangeAddress: ZERO,
          tokenOutAddress: TOKEN,
          paymentReceiverAddress: wallets[1].address,
          feeReceiverAddress: wallets[2].address,
          exchangeType: 0,
          receiverType: 0,
          exchangeCallData: ZERO,
          receiverCallData: ZERO,
          deadline,
        }

        const paymentReceiverBalanceBefore = await tokenContract.balanceOf(wallets[1].address)
        const feeReceiverBalanceBefore = await tokenContract.balanceOf(wallets[2].address)

        await router.connect(wallets[0])[PAY](payment)

        const paymentReceiverBalanceAfter = await tokenContract.balanceOf(wallets[1].address)
        const feeReceiverBalanceAfter = await tokenContract.balanceOf(wallets[2].address)

        expect(paymentReceiverBalanceAfter).to.eq(paymentReceiverBalanceBefore.add(paymentAmount))
        expect(feeReceiverBalanceAfter).to.eq(feeReceiverBalanceBefore.add(feeAmount))
      })
    })
  })
}
