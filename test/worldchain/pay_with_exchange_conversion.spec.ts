import payWithExchangeConversion from '../_pay-with-exchange-conversion'

payWithExchangeConversion({
  blockchain: 'worldchain',
  fromToken: '0x2cFc85d8E48F8EAB294be644d9E25C3030863003',
  fromAccount: '0x3b9Ce4B73fB57181194d83EC44544c0ccc77319a', // needs to hold enough fromToken, will be impersonated
  toToken: '0x79A02482A880bCE3F13e09Da970dC34db4CD24d1',
  exchanges: [
    { name: 'uniswap_v3', type: 'pull' },
  ]
})
