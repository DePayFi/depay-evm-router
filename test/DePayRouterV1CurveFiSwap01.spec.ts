import chai, { expect } from 'chai'

import { solidity, loadFixture } from 'ethereum-waffle'

import { cureFiSwapFixture, curveFiSystemFixture, unapprovedCureFiFixture } from './fixtures/curvefi-swap'

import { route as routerFunc } from './functions'

import { now, ETH } from './utils'

chai.use(solidity)

describe('CurveFiSwap01', () => {
  
  it('CurveFi: Admin address of AddressProvider should be ownerWallet', async()=>{
    const { curveFiAddressProvider, ownerWallet  } = await loadFixture(
      curveFiSystemFixture
    )
    console.log(curveFiAddressProvider.address, await curveFiAddressProvider.admin());
    expect(ownerWallet.address).to.equal(await curveFiAddressProvider.admin())
  })

  it('CurveFi: Registry\'s address in AddressProvider should be the same', async()=>{
    const { curveFiAddressProvider, curveFiRegistryMock  } = await loadFixture(
      unapprovedCureFiFixture
    )
    expect(()=>curveFiRegistryMock.address).to.equal(await curveFiAddressProvider.get_registry())
  })

  it('CurveFi: Swap token via CurveFiSwap01 plugin', async () => {
    const { curveFiPoolMock, fromToken, toToken, ownerWallet, router, curveFiPlugin } = await loadFixture(
      cureFiSwapFixture
    )

    let path = [curveFiPoolMock.address, fromToken.address, toToken.address]
    let amounts = [1000, 1000]

    await expect(() =>
      routerFunc({
        router,
        wallet: ownerWallet,
        path,
        amounts,
        addresses: [],
        plugins: [curveFiPlugin.address]
      })
    ).to.changeTokenBalance(toToken, router.address, 1000)
  })
})
