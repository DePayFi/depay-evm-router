import chai, { expect } from 'chai'

import { solidity, loadFixture } from 'ethereum-waffle'
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

  it('Index of tokens is should be correct in the registry', async () => {
    const { curveFiRegistryMock, fromToken, toToken, curveFiPoolMock } = await loadFixture(cureFiSwapFixture)
    const [fromIndex, toIndex, isUnderlying] = await curveFiRegistryMock.get_coin_indices(
      curveFiPoolMock.address,
      fromToken.address,
      toToken.address
    )
    expect(fromIndex.toNumber()).to.equal(0)
    expect(toIndex.toNumber()).to.equal(1)
    expect(isUnderlying).to.equal(false)
  })

  it('Swap token via CurveFiSwap01 plugin', async () => {
    const { curveFiPoolMock, fromToken, toToken, ownerWallet, router, curveFiPlugin } = await loadFixture(
      cureFiSwapFixture
    )
    await expect(() =>
      routerFunc({
        router,
        wallet: ownerWallet,
        path: [fromToken.address, toToken.address],
        amounts: [1000, 1000],
        addresses: [curveFiPoolMock.address],
        plugins: [curveFiPlugin.address]
      })
    ).to.changeTokenBalance(toToken, router, 1000)
  })

  it('Swap token via CurveFiSwap01 plugin before perform payment', async () => {
    const { curveFiPoolMock, fromToken, toToken, ownerWallet, router, curveFiPlugin, paymentPlugin } = await loadFixture(
      cureFiSwapFixture
    )

    await expect(() =>
      routerFunc({
        router,
        wallet: ownerWallet,
        path: [fromToken.address, toToken.address],
        amounts: [1000, 1000],
        addresses: [curveFiPoolMock.address, otherWallet.address],
        plugins: [curveFiPlugin.address, paymentPlugin.address]
      })
    ).to.changeTokenBalance(toToken, otherWallet, 1000)
  })

})
