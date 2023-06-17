import { ethers } from 'hardhat'

export default async () => {
  const Router = await ethers.getContractFactory('DePayRouterV2')
  const router = await Router.deploy()
  await router.deployed()

  return router
}
