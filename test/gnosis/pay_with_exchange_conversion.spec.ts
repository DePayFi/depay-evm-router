import payWithExchangeConversion from '../_pay-with-exchange-conversion'

payWithExchangeConversion({
  blockchain: 'gnosis',
  fromToken: '0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83', // USDC
  fromAccount: '0x9d4E94dB689Bc471E45b0a18B7BdA36FcCeC9c3b', // needs to hold enough fromToken, will be impersonated
  toToken: '0x21a42669643f45bc0e086b8fc2ed70c23d67509d', // FOX
  exchanges: [
    { name: 'honeyswap', type: 'pull' },
  ]
})
