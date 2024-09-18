import payWithExchangeConversion from '../_pay-with-exchange-conversion'

payWithExchangeConversion({
  blockchain: 'optimism',
  fromToken: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', // USDT
  fromAccount: '0xF977814e90dA44bFA03b6295A0616a897441aceC', // needs to hold enough fromToken, will be impersonated
  toToken: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', // USDC
  exchanges: [
    { name: 'uniswap_v3', type: 'push' },
  ]
})
