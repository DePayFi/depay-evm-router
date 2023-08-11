import { ethers } from 'hardhat'

export default async (address)=> {
  await ethers.provider.send('hardhat_impersonateAccount', [address])
  const signer = await ethers.provider.getSigner(address)
  return signer
}
