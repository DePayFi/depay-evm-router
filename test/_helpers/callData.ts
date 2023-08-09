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
    contractMethod = method
    paramsToEncode = [params[fragment.inputs[0].name]]
  } else {
    contractMethod = `${method}(${fragment.inputs.map((input)=>input.type).join(',')})`
    paramsToEncode = fragment.inputs.map((input) => {
      if(input.type === 'tuple') {
        let tuple = {}
        input.components.forEach((component, index)=>{
          tuple[component.name] = params[input.name][index]
        })
        contractMethod = method
        return tuple
      } else {
        return params[input.name]
      }
    })
  }
  return contract.interface.encodeFunctionData(contractMethod, paramsToEncode)
}
