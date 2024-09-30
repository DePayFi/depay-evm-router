import payWithExchangeConversion from '../_pay-with-exchange-conversion'

payWithExchangeConversion({
  blockchain: 'polygon',
  fromToken: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', // DAI
  fromAccount: '0xF977814e90dA44bFA03b6295A0616a897441aceC', // needs to hold enough fromToken, will be impersonated
  toToken: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // USDC
  exchanges: [
    { name: 'uniswap_v3', type: 'push' },
    { name: 'quickswap', type: 'pull' },
  ]
})
