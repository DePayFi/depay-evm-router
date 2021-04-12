import { Signer } from '@ethersproject/abstract-signer'
import { Contract } from '@ethersproject/contracts'
import hre from 'hardhat'
import { DePayRouterV1Configuration } from '../../typechain/DePayRouterV1Configuration'

const zeroAddress = '0x0000000000000000000000000000000000000000'

interface IKeyValues {
  [key: string]: string
}

interface IKeyObject {
  [key: string]: IKeyValues
}

interface ISignerCache {
  [key: string]: Signer
}

export interface IMainnetContext extends IKeyValues {
  DePayRouterV1Owner: string
  DePayRouterV1: string
  DePayRouterV1Configuration: string
  OneSplitAudit: string
  WETH: string
  REVV: string
}

interface INetworkContext extends IKeyObject {
  mainnet: IMainnetContext
}

const context: INetworkContext = {
  mainnet: {
    DePayRouterV1Owner: '',
    DePayRouterV1: '0xae60aC8e69414C2Dc362D0e6a03af643d1D85b92',
    DePayRouterV1Configuration: '0x6EF8833d250f2Df4E7b66ECA01cA5A0D2a34B2fF',
    OneSplitAudit: '0xC586BeF4a0992C495Cf22e1aeEE4E446CECDee0E',
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    REVV: '0x557B933a7C2c45672B610F8954A3deB39a51A8Ca'
  }
}

const signers: ISignerCache = {}

const signerAlias: IKeyValues = {}

export async function unlockSigner(alias: string): Promise<Signer>

export async function unlockSigner(alias: string, address: string): Promise<Signer>

export async function unlockSigner(...params: string[]): Promise<Signer> {
  if (params.length === 1) {
    const [alias] = params
    if (typeof alias !== 'string') throw new Error('Alias was not a string')
    if (typeof signerAlias[alias] === 'undefined') throw new Error('Alias was not defined')
    if (typeof signers[signerAlias[alias]] === 'undefined') throw new Error('Signer was not unblocked')
    // We will get unlocked signer by alias
    return signers[signerAlias[alias]]
  } else if (params.length === 2) {
    const [alias, address] = params
    // Prevent case sensitive
    const key = address.toLowerCase()
    if (typeof signers[address] === 'undefined') {
      if (typeof signerAlias[alias] === 'undefined') {
        signerAlias[alias] = key
      }
      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [address]
      })
      signers[address] = await hre.ethers.provider.getSigner(address)
    }
    return signers[address]
  }
  throw new Error('Number of parameters was not match')
}

export async function getContractByNameAddAddress(
  contractName: string,
  contractAddress: string = zeroAddress
): Promise<Contract> {
  const instanceFactory = await hre.ethers.getContractFactory(contractName)
  const instance = await instanceFactory.attach(contractAddress)
  return instance
}

export async function getContractByName(queryString: string, network: string = 'mainnet') {
  if (typeof context[network] === 'undefined') throw new Error(`Undefined network: ${network}`)
  const record = Object.entries(context[network])
    .filter(([key, value]: [string, string]) => queryString === key || queryString === value)
    .pop()
  if (!record) throw new Error(`Can find matched string ${queryString}`)
  const [contractName, contractAddress] = record
  return getContractByNameAddAddress(contractName, contractAddress)
}

export async function getFirstSigner(): Promise<Signer> {
  const [owner] = await hre.ethers.getSigners()
  return owner
}

export async function contractDeploy(actor: Signer, contractName: string, ...params: any[]) {
  const instanceFactory = await hre.ethers.getContractFactory(contractName)
  const instance = await instanceFactory.connect(actor).deploy(...params)
  return instance
}

export async function initContext(network: string = 'mainnet') {
  if (typeof context[network] === 'undefined') throw new Error(`Undefined network: ${network}`)
  if (context[network].DePayRouterV1Owner === '') {
    const instanceV1Configuration = <DePayRouterV1Configuration>await getContractByName('DePayRouterV1Configuration')
    context[network].DePayRouterV1Owner = await instanceV1Configuration.owner()
  }
  return context[network]
}
