import {
  BigNumber,
  Contract,
  Wallet,
} from 'ethers'

import { 
  MockProvider,
} from 'ethereum-waffle'

export const ETH = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
export const MAXINT = BigNumber.from("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")

export const now = () => Math.round(new Date().getTime() / 1000)

const provider = new MockProvider({
  ganacheOptions: {
    mnemonic: 'pay pay pay pay pay pay pay pay pay pay pay pay',
    allowUnlimitedContractSize: true // as UniswapV2Router02 is just too big
  }
})

export const [ownerWallet, otherWallet] = provider.getWallets()

interface createUniswapPairParameters {
  token0: Contract,
  token1: Contract,
  WETH: Contract,
  router: Contract,
  wallet: Wallet,
  uniswapFactory: Contract
}

export async function createUniswapPair({
  token0,
  token1,
  WETH,
  router,
  wallet,
  uniswapFactory
}: createUniswapPairParameters) {
  if(token0 != WETH) {
    await token0.connect(wallet).transfer(wallet.address, 1000000)
    await token0.connect(wallet).approve(router.address, MAXINT)
  }
  
  if(token1 == WETH) { throw 'token1 is not allowed to be WETH, use token0 instead!' }
  await token1.connect(wallet).transfer(wallet.address, 1000000)
  await token1.connect(wallet).approve(router.address, MAXINT)

  await uniswapFactory.createPair(token0.address, token1.address)
  const pairAddress = await uniswapFactory.getPair(token0.address, token1.address)
  
  if(token0 == WETH) {
    await router.connect(wallet).addLiquidityETH(
      token1.address,
      1000000,
      1000000,
      1000000,
      wallet.address,
      MAXINT,
      {value: 1000000}
    )
  } else {
    await router.connect(wallet).addLiquidity(
      token0.address,
      token1.address,
      1000000,
      1000000,
      1000000,
      1000000,
      wallet.address,
      MAXINT
    )
  }

  return pairAddress
}
