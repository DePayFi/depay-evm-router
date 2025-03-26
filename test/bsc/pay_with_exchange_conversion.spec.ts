import payWithExchangeConversion from '../_pay-with-exchange-conversion'

payWithExchangeConversion({
  blockchain: 'bsc',
  fromToken: '0x55d398326f99059fF775485246999027B3197955', // USDT
  fromAccount: '0x4fdFE365436b5273a42F135C6a6244A20404271E', // needs to hold enough fromToken, will be impersonated
  toToken: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', // USDC
  exchanges: [
    { name: 'pancakeswap_v3', type: 'pull' },
    { name: 'pancakeswap', type: 'pull' },
    { name: 'uniswap_v3', type: 'pull' },
  ]
})
