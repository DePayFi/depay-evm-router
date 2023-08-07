import { ethers } from 'hardhat'

export default ({
  address,
  api,
  provider,
  method,
  params
})=> {
  const contract = new ethers.Contract(address, api, provider)
  if(contract[method] === undefined){
    let fragment = contract.interface.fragments.find((fragment) => {
      return fragment.name == method
    })
    method = `${method}(${fragment.inputs.map((input)=>input.type).join(',')})`;
  }
  let fragment = contract.interface.fragments.find((fragment) => {
    return fragment.name == method || `${fragment.name}(${fragment.inputs.map((input)=>input.type).join(',')})` == method
  })
  const paramsAsArray = fragment.inputs.map((input) => {
    return params[input.name]
  })
  return contract.interface.encodeFunctionData(method, paramsAsArray)
}
