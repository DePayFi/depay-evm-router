import payWithExchangeConversion from '../_pay-with-exchange-conversion'

payWithExchangeConversion({
  blockchain: 'polygon',
  fromToken: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // USDT
  fromAccount: '0xF977814e90dA44bFA03b6295A0616a897441aceC', // needs to hold enough fromToken, will be impersonated
  toToken: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // USDC
  exchanges: [
    { name: 'uniswap_v3', type: 'push' },
    { name: 'quickswap', type: 'pull' },
  ]
})
