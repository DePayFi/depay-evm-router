import deployConfiguration from '../helpers/deploy/configuration'
import deployRouter from '../helpers/deploy/router'
import deployTestToken from '../helpers/deploy/testToken'
import IDePayRouterV1 from '../../artifacts/contracts/interfaces/IDePayRouterV1.sol/IDePayRouterV1.json'
import impersonate from '../helpers/impersonate'
import { CONSTANTS } from 'depay-web3-constants'
import { ethers } from 'hardhat'
import { expect } from 'chai'
import { Token } from 'depay-web3-tokens'

const blockchain = 'bsc'

describe(`DePayRouterV1 on ${blockchain}`, () => {

  let wallets,
      configuration,
      router

  beforeEach(async ()=>{
    wallets = await ethers.getSigners()
  })

  it('deploys router successfully', async () => {
    configuration = await deployConfiguration()
    router = await deployRouter(configuration.address)
  })

  it('makes sure DePayRouterV1 has the same interface as IDePayRouterV1', async () => {
    IDePayRouterV1.abi.forEach((abiFragment)=>{
      let implementedFragment = router.interface.fragments.find((fragment)=>(fragment.name == abiFragment.name))
      abiFragment.inputs.forEach((abiInput)=>{
        let implementedInput = implementedFragment.inputs.find((input)=>(input.name == abiInput.name))
        expect(implementedInput.type).to.eq(abiInput.type);
      })
      expect(abiFragment.outputs[0].type).to.eq(implementedFragment.outputs[0].type);
      expect(abiFragment.type).to.equal(implementedFragment.type);
    })
  })

  it('sets the deployer wallet as the contract owner', async () => {
    const owner = await configuration.owner()
    expect(owner).to.equal(wallets[0].address)
  })

  it('can receive ETH, which is required for ETH transfers and swapping', async () => {
    await expect(()=>
      wallets[1].sendTransaction({ to: router.address, value: 1000 })
    ).to.changeEtherBalance(wallets[1], -1000)
  })

  it('fails if the sent NATIVE token value is to low to forward it to the receiver', async () => {
    await expect(
      router.connect(wallets[0]).route(
        [CONSTANTS[blockchain].NATIVE], // path
        [1000], // amounts
        [], // addresses
        [], // plugins
        [], // data
        { value: 999 }
      )
    ).to.be.revertedWith(
      'DePay: Insufficient amount payed in!'
    )
  })

  it('allows owner to withdraw NATIVE token that remained in the contract', async () => {
    await wallets[1].sendTransaction({ to: router.address, value: 1000 })

    await expect(
      await router.connect(wallets[0]).withdraw(CONSTANTS[blockchain].NATIVE, 1000)
    ).to.changeEtherBalance(wallets[0], 1000)
  })

  it('does not allow others to withdraw NATIVE tokens that remained in the contract', async () => {
    await wallets[1].sendTransaction({ to: router.address, value: 1000 })

    await expect(
      router.connect(wallets[1]).withdraw(CONSTANTS[blockchain].NATIVE, 1000)
    ).to.be.revertedWith(
      'Ownable: caller is not the owner'
    )
  })

  it('allows owner to withdraw tokens that remained in the contract', async () => {
    let testToken = await deployTestToken()
    await testToken.transfer(router.address, 1000)

    await expect(() => 
      router.connect(wallets[0]).withdraw(testToken.address, 1000)
    ).to.changeTokenBalance(testToken, wallets[0], 1000)
  })

  it('does not allow others to withdraw tokens that remained in the contract', async () => {
    let testToken = await deployTestToken()
    await testToken.transfer(router.address, 1000)

    await expect(
      router.connect(wallets[1]).withdraw(testToken.address, 1000)
    ).to.be.revertedWith(
      'Ownable: caller is not the owner'
    )
  })

  it('tells you if a plugin has been approved or not', async () => {
    const Plugin = await ethers.getContractFactory('DePayRouterV1Payment01')
    let plugin = await Plugin.deploy()
    await plugin.deployed()
    await configuration.connect(wallets[0]).approvePlugin(plugin.address)
    expect(await router.isApproved(plugin.address)).to.eq(true)
    expect(await router.isApproved(wallets[1].address)).to.eq(false)
  })

  it('fails when trying to use a plugin that is not approved', async () => {
    const Plugin = await ethers.getContractFactory('DePayRouterV1Payment01')
    let plugin = await Plugin.deploy()
    await plugin.deployed()
    expect(await router.isApproved(plugin.address)).to.eq(false)

    await expect(
      router.connect(wallets[0]).route(
        [CONSTANTS[blockchain].NATIVE], // path
        [1000], // amounts
        [], // addresses
        [plugin.address], // plugins
        [], // data
        { value: 1000 }
      )
    ).to.be.revertedWith(
      'DePay: Plugin not approved!'
    )
  })

  describe('requires payment plugin', ()=> {

    let BUSD = '0xe9e7cea3dedca5984780bafc599bd69add087d56'
    let addressWithBUSD = '0x8894E0a0c962CB723c1976a4421c95949bE2D4E3'
    let addressWithBNB = '0x8894E0a0c962CB723c1976a4421c95949bE2D4E3'
    let paymentPlugin

    beforeEach(async ()=>{
      const Plugin = await ethers.getContractFactory('DePayRouterV1Payment01')
      paymentPlugin = await Plugin.deploy()
      await paymentPlugin.deployed()
      await configuration.connect(wallets[0]).approvePlugin(paymentPlugin.address)
    })

    it('makes sure that the token balance in the smart contract is >= after the payment compared to before', async () => {
      let amountIn = ethers.utils.parseUnits('1000', 18)
      let amountOut = ethers.utils.parseUnits('2000', 18)
      let BUSDToken = await ethers.getContractAt(Token[blockchain].DEFAULT, BUSD)
      const signer = await impersonate(addressWithBUSD)
      await BUSDToken.connect(signer).approve(router.address, CONSTANTS[blockchain].MAXINT)
      await BUSDToken.connect(signer).transfer(router.address, amountOut)
      await expect(
        router.connect(signer).route(
          [BUSD], // path
          [amountIn, amountOut], // amounts
          [addressWithBUSD, wallets[1].address], // addresses
          [paymentPlugin.address], // plugins
          [] // data
        )
      ).to.be.revertedWith(
        'DePay: Insufficient balance after payment!'
      )
    })

    it('makes sure that the eth balance in the smart contract is >= after the payment compared to before', async () => {
      let amountIn = ethers.utils.parseUnits('1', 18)
      let amountOut = ethers.utils.parseUnits('2', 18)
      const signer = await impersonate(addressWithBNB)
      await signer.sendTransaction({
        to: router.address,
        value: amountOut
      })
      await expect(
        router.connect(signer).route(
          [CONSTANTS[blockchain].NATIVE], // path
          [amountIn, amountOut], // amounts
          [addressWithBNB, wallets[1].address], // addresses
          [paymentPlugin.address], // plugins
          [], // data
          { value: amountIn }
        )
      ).to.be.revertedWith(
        'DePay: Insufficient balance after payment!'
      )
    })
  })
})
