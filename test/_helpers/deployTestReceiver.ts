import { ethers } from 'hardhat'

export default async () => {
  const TestReceiver = await ethers.getContractFactory('TestReceiver')
  const testReceiver = await TestReceiver.deploy()
  await testReceiver.deployed()

  return testReceiver
}
