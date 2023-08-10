import payWithExchangeConversion from '../_pay-with-exchange-conversion'

payWithExchangeConversion({
  blockchain: 'arbitrum',
  fromToken: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // USDT
  fromAccount: '0xB38e8c17e38363aF6EbdCb3dAE12e0243582891D', // needs to hold enough fromToken, will be impersonated
  toToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC
  exchanges: [
    { name: 'uniswap_v3', type: 'push' },
  ]
})
