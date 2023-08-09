import { ethers } from 'hardhat'

const FORWARDER = '0x0000000000000000000000000000000000000000'

export default async () => {
  const Router = await ethers.getContractFactory('DePayRouterV2')
  const router = await Router.deploy(FORWARDER)
  await router.deployed()

  return router
}
