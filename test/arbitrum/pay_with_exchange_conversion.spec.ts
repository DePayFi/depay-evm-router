import payWithExchangeConversion from '../_pay-with-exchange-conversion'

payWithExchangeConversion({
  blockchain: 'arbitrum',
  fromToken: '0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0', // UNISWAP
  fromAccount: '0x814185bB33e787a638dFb27F551CF70333FB6412', // needs to hold enough fromToken, will be impersonated
  toToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC
  exchanges: [
    { name: 'uniswap_v3', type: 'pull' },
  ]
})
