import payWithExchangeConversion from '../_pay-with-exchange-conversion'

payWithExchangeConversion({
  blockchain: 'polygon',
  fromToken: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619', // WETH
  fromAccount: '0x62ac55b745F9B08F1a81DCbbE630277095Cf4Be1', // needs to hold enough fromToken, will be impersonated
  toToken: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // USDC
  exchanges: [
    { name: 'uniswap_v3', type: 'push' },
  ]
})
