import { ethers } from 'hardhat'

export default async (configuration: string) => {
  const Router = await ethers.getContractFactory('DePayRouterV1')
  const router = await Router.deploy(configuration)
  await router.deployed()

  return router
}
