import payToContractReceiver from '../_pay-to-contract-receiver'

payToContractReceiver({
  blockchain: 'gnosis',
  fromToken: '0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83', // USDC
  fromAccount: '0x725Cdb48F0Ea078E46e96b0B6cD2027B97b99B83', // needs to hold enough fromToken, will be impersonated
  toToken: '0x21a42669643f45bc0e086b8fc2ed70c23d67509d', // FOX
  exchange: { name: 'honeyswap', type: 'pull' },
})
