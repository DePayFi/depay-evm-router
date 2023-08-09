import { ethers } from 'hardhat'

export default ({
  address,
  api,
  provider,
  method,
  params
})=> {
  const contract = new ethers.Contract(address, api, provider)
  let contractMethod
  let fragment
  fragment = contract.interface.fragments.find((fragment) => {
    return(
      fragment.name == method &&
      (fragment.inputs && params && typeof(params) === 'object' ? fragment.inputs.length == Object.keys(params).length : true)
    )
  })
  let paramsToEncode
  if(fragment.inputs.length === 1 && fragment.inputs[0].type === 'tuple') {
    paramsToEncode = [params[fragment.inputs[0].name]]
    contractMethod = method
  } else {
    paramsToEncode = fragment.inputs.map((input) => {
      return params[input.name]
    })
    contractMethod = `${method}(${fragment.inputs.map((input)=>input.type).join(',')})`
  }
  return contract.interface.encodeFunctionData(contractMethod, paramsToEncode)
}
