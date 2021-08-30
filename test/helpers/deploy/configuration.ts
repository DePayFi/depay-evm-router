import { ethers } from 'hardhat'

export default async () => {
  const Configuration = await ethers.getContractFactory('DePayRouterV1Configuration')
  const configuration = await Configuration.deploy()
  await configuration.deployed()

  return configuration
}
