import deploy from './_helpers/deploy'
import impersonate from './_helpers/impersonate'
import now from './_helpers/now'
import Token from '@depay/web3-tokens-evm'
import Web3Blockchains from '@depay/web3-blockchains'
import { ethers } from 'hardhat'
import { expect } from 'chai'

export default ({ blockchain, token, fromAccount, reversalReason })=>{

  const NATIVE = Web3Blockchains[blockchain].currency.address
  const WRAPPED = Web3Blockchains[blockchain].wrapped.address
  const TOKEN = token
  const ZERO = Web3Blockchains[blockchain].zero
  const provider = ethers.provider

  describe(`DePayRouterV2 on ${blockchain}`, ()=> {

    describe(`pay with TOKEN using PERMIT2`, ()=> {

      let wallets
      let router
      let deadline
      let tokenContract

      beforeEach(async ()=>{
        wallets = await ethers.getSigners()
        tokenContract = new ethers.Contract(TOKEN, Token[blockchain]['20'], wallets[0])
        if(typeof fromAccount === 'string') { fromAccount = await impersonate(fromAccount) }
        deadline = now()+ 86400 // 1 day
      })

      it('deploys router successfully', async ()=> {
        router = await deploy()
      })

      it('perfoms payment with a valid permit2 signature', async ()=> {
        await expect(
          router.connect(fromAccount).pay({
            amountIn: 1000000000,
            paymentAmount: 1000000000,
            feeAmount: 0,
            tokenInAddress: TOKEN,
            exchangeAddress: ZERO,
            tokenOutAddress: TOKEN,
            paymentReceiverAddress: wallets[1].address,
            feeReceiverAddress: ZERO,
            exchangeType: 0,
            receiverType: 0,
            exchangeCallData: ZERO,
            receiverCallData: ZERO,
            deadline,
          })
        ).to.be.revertedWith(
          reversalReason
        )
      })
    })
  })
}
