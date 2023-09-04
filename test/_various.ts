import deploy from './_helpers/deploy'
import now from './_helpers/now'
import Token from '@depay/web3-tokens-evm'
import Blockchains from '@depay/web3-blockchains'
import { ethers } from 'hardhat'
import { expect } from 'chai'

export default ({ blockchain })=>{

  const NATIVE = Blockchains[blockchain].currency.address
  const WRAPPED = Blockchains[blockchain].wrapped.address
  const WRAPPED_API = [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"guy","type":"address"},{"name":"wad","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"src","type":"address"},{"name":"dst","type":"address"},{"name":"wad","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"wad","type":"uint256"}],"name":"withdraw","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"dst","type":"address"},{"name":"wad","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"deposit","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"},{"name":"","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"src","type":"address"},{"indexed":true,"name":"guy","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"src","type":"address"},{"indexed":true,"name":"dst","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"dst","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Deposit","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"src","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Withdrawal","type":"event"}]
  const ZERO = Blockchains[blockchain].zero
  const provider = ethers.provider
  const PAY = 'pay((uint256,bool,uint256,uint256,address,address,address,address,address,uint8,uint8,bytes,bytes,uint256))'

  describe(`DePayRouterV2 on ${blockchain}`, ()=> {

    describe(`various other router functionalities`, ()=> {

      let wallets
      let router
      let deadline

      beforeEach(async ()=>{
        wallets = await ethers.getSigners()
        deadline = now()+ 86400 // 1 day
      })

      it('deploys router successfully', async ()=> {
        router = await deploy()
      })

      it('only allows the owner to approve exchanges', async ()=> {
        await expect(
          router.connect(wallets[0]).enable(WRAPPED, true)
        ).to.emit(router, 'Enabled').withArgs(WRAPPED)

        let isApproved = await router.connect(wallets[0]).exchanges(WRAPPED)
        expect(isApproved).to.eq(true)
      })

      it('does not allow others to approve exchanges', async ()=> {
        await expect(
          router.connect(wallets[1]).enable(WRAPPED, true)
        ).to.be.revertedWith(
          'Ownable: caller is not the owner'
        )
      })

      it('fails if trying to convert through a not-approved exchange', async ()=> {
        await expect(
          router.connect(wallets[0])[PAY]({
            amountIn: 1000000000,
            paymentAmount: 1000000000,
            feeAmount: 1,
            tokenInAddress: NATIVE,
            exchangeAddress: "0x00000000000080C886232E9b7EBBFb942B5987AA",
            tokenOutAddress: NATIVE,
            paymentReceiverAddress: wallets[1].address,
            feeReceiverAddress: ZERO,
            exchangeType: 0,
            receiverType: 0,
            exchangeCallData: ZERO,
            receiverCallData: ZERO,
            deadline,
          }, { value: 1000000000 })
        ).to.be.revertedWith(
          'ExchangeNotApproved()'
        )
      })

      it('does not allow others to disapprove exchanges', async ()=> {
        await expect(
          router.connect(wallets[1]).enable(WRAPPED, false)
        ).to.be.revertedWith(
          'Ownable: caller is not the owner'
        )
      })

      it('only allows the owner to disapprove exchanges', async ()=> {
        await expect(
          router.connect(wallets[0]).enable(WRAPPED, false)
        ).to.emit(router, 'Disabled').withArgs(WRAPPED)

        let isApproved = await router.connect(wallets[0]).exchanges(WRAPPED)
        expect(isApproved).to.eq(false)
      })

      it('does not allow others to withdraw stuck NATIVE tokens', async ()=> {
        await wallets[0].sendTransaction({ to: router.address, value: 1000 })
        await expect(
          router.connect(wallets[1]).withdraw(NATIVE, 1000)
        ).to.be.revertedWith(
          'Ownable: caller is not the owner'
        )
      })

      it('only allows the owner to approve exchanges', async ()=> {
        const amountBN = ethers.BigNumber.from('100000000000000')
        await wallets[0].sendTransaction({ to: router.address, value: amountBN })
        const balanceBefore = await provider.getBalance(wallets[0].address)
        await router.connect(wallets[0]).withdraw(NATIVE, amountBN)
        const balanceAfter = await provider.getBalance(wallets[0].address)
        expect(balanceAfter > balanceBefore).to.eq(true)
      })

      it('allows the owner to withdraw stuck TOKENS', async ()=> {

        const amountBN = ethers.BigNumber.from('100000000000000')
        const token = new ethers.Contract(WRAPPED, WRAPPED_API, wallets[0])
        await token.deposit({value: amountBN})
        await token.transfer(router.address, amountBN)

        const balanceBefore = await token.balanceOf(wallets[0].address)
        await router.connect(wallets[0]).withdraw(WRAPPED, amountBN)
        const balanceAfter = await token.balanceOf(wallets[0].address)
        expect(balanceAfter).to.eq(balanceBefore.add(amountBN))
      })

      it('does not allow others to withdraw stuck TOKENS', async ()=> {

        const amountBN = ethers.BigNumber.from('100000000000000')
        const token = new ethers.Contract(WRAPPED, WRAPPED_API, wallets[0])
        await token.deposit({value: amountBN})
        await token.transfer(router.address, amountBN)

        await expect(
          router.connect(wallets[1]).withdraw(WRAPPED, amountBN)
        ).to.be.revertedWith(
          'Ownable: caller is not the owner'
        )
      })
    })
  })
}
