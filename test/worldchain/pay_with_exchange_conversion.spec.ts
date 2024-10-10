import payWithExchangeConversion from '../_pay-with-exchange-conversion'

payWithExchangeConversion({
  blockchain: 'worldchain',
  fromToken: '0x79A02482A880bCE3F13e09Da970dC34db4CD24d1', // USDCe
  fromAccount: '0xDc927Bd56CF9DfC2e3779C7E3D6d28dA1C219969', // needs to hold enough fromToken, will be impersonated
  toToken: '0x2cFc85d8E48F8EAB294be644d9E25C3030863003', // WDL
  exchanges: [
    { name: 'uniswap_v3', type: 'pull' },
  ]
})
