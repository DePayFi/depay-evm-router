import chai, { expect } from 'chai'

import { waffle } from 'hardhat'
const { solidity, loadFixture } = waffle

import { BigNumber } from 'ethers'

import {
  cureFiFixture,
  cureFiSwapFixture,
  curveFiSystemFixture,
  unapprovedCureFiFixture
} from './fixtures/curvefi-swap'

import { route as routerFunc } from './functions'

import { now, ETH, otherWallet } from './utils'

chai.use(solidity)

describe('DePayRouterV1 + DePayRouterV1CurveFiSwap01', () => {
  it('AddressProvider and Registry should be deploy correctly', async () => {
    await loadFixture(unapprovedCureFiFixture)
  })

  it('Admin address of AddressProvider should be ownerWallet', async () => {
    const { curveFiAddressProvider, ownerWallet } = await loadFixture(unapprovedCureFiFixture)
    expect(ownerWallet.address).to.equal(await curveFiAddressProvider.admin())
  })

  it("Registry's address in AddressProvider should be the same", async () => {
    const { curveFiAddressProvider, curveFiRegistryMock } = await loadFixture(unapprovedCureFiFixture)
    expect(curveFiRegistryMock.address).to.equal(await curveFiAddressProvider.get_registry())
  })

  it('Should able to add liquidity to pool', async () => {
    const { curveFiPool, ownerWallet } = await loadFixture(cureFiSwapFixture)
    await curveFiPool
      .connect(ownerWallet)
      .add_liquidity(['100000000000000000000', '100000000000000000000', '100000000000000000000'], 0, {
        gasLimit: 4000000
      })
  })

  it('Index of tokens is should be correct in the registry', async () => {
    const { curveFiRegistryMock, tokenA, tokenB, curveFiPool } = await loadFixture(cureFiSwapFixture)
    const [fromIndex, toIndex, isUnderlying] = await curveFiRegistryMock.get_coin_indices(
      curveFiPool.address,
      tokenA.address,
      tokenB.address
    )
    expect(fromIndex.toNumber()).to.equal(0)
    expect(toIndex.toNumber()).to.equal(1)
    expect(isUnderlying).to.equal(false)
  })

  it('Swap token via CurveFiSwap01 plugin', async () => {
    const { tokenA, tokenB, curveFiPool, ownerWallet, router, curveFiPlugin } = await loadFixture(cureFiSwapFixture)
    await expect(() =>
      routerFunc({
        router,
        wallet: ownerWallet,
        path: [tokenA.address, tokenB.address],
        amounts: [1000000, 1000],
        addresses: [curveFiPool.address],
        plugins: [curveFiPlugin.address]
      })
    ).to.changeTokenBalance(tokenB, router, 999600)
  })

  it('Swap token via CurveFiSwap01 plugin before perform payment', async () => {
    const { tokenA, tokenB, curveFiPool, ownerWallet, router, curveFiPlugin, paymentPlugin } = await loadFixture(
      cureFiSwapFixture
    )

    await expect(() =>
      routerFunc({
        router,
        wallet: ownerWallet,
        path: [tokenA.address, tokenB.address],
        amounts: [1000000, 999600],
        addresses: [curveFiPool.address, otherWallet.address],
        plugins: [curveFiPlugin.address, paymentPlugin.address]
      })
    ).to.changeTokenBalance(tokenB, otherWallet, 999600)
  })
})
