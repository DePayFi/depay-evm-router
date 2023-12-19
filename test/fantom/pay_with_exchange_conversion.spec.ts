import payWithExchangeConversion from '../_pay-with-exchange-conversion'

payWithExchangeConversion({
  blockchain: 'fantom',
  fromToken: '0x28a92dde19D9989F39A49905d7C9C2FAc7799bDf', // USDC
  fromAccount: '0x49e8B354900cc124E31a5e43747e5e84bB93380F', // needs to hold enough fromToken, will be impersonated
  toToken: '0x841FAD6EAe12c286d1Fd18d1d525DFfA75C7EFFE', // BOO
  exchanges: [
    { name: 'spookyswap', type: 'pull' },
  ]
})
