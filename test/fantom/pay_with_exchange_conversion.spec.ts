import payWithExchangeConversion from '../_pay-with-exchange-conversion'

payWithExchangeConversion({
  blockchain: 'fantom',
  fromToken: '0x28a92dde19D9989F39A49905d7C9C2FAc7799bDf', // USDC
  fromAccount: '0xd30442bEEE8269bFb3829c401C62B38d2EA5BdB4', // needs to hold enough fromToken, will be impersonated
  toToken: '0x841FAD6EAe12c286d1Fd18d1d525DFfA75C7EFFE', // BOO
  exchanges: [
    { name: 'spookyswap', type: 'pull' },
  ]
})
