import { ethers } from 'hardhat'

export default async ({ WRAPPED }) => {
  const Router = await ethers.getContractFactory('DePayRouterV2')
  const router = await Router.deploy(WRAPPED)
  await router.deployed()

  return router
}
