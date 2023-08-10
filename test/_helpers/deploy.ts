import { ethers } from 'hardhat'

const PERMIT2 = '0x000000000022D473030F116dDEE9F6B43aC78BA3'

export default async () => {
  const Forwarder = await ethers.getContractFactory('DePayForwarderV2')
  const forwarder = await Forwarder.deploy()

  const Router = await ethers.getContractFactory('DePayRouterV2')
  const router = await Router.deploy(PERMIT2, forwarder.address)
  await router.deployed()

  return router
}
