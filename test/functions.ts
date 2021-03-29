import { Contract, Wallet } from 'ethers'

interface routeParameters {
  router: Contract
  wallet: Wallet
  path: string[]
  amounts: number[]
  addresses: string[]
  plugins: string[]
  data?: string[]
  value?: number
}

export async function route({
  router,
  wallet,
  path,
  amounts,
  addresses,
  plugins,
  data = [],
  value = 0
}: routeParameters) {
  // @todo: We will take a look into it later. For now, temporary hard code gasLimit
  return router.connect(wallet).route(path, amounts, addresses, plugins, data, { value: value, gasLimit: 4000000 })
}
