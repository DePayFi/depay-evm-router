import {
  BigNumber,
  Contract,
  Wallet,
} from 'ethers'

import { 
  MockProvider,
} from 'ethereum-waffle'

export const ZERO_ADDRESS='0x0000000000000000000000000000000000000000';
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
