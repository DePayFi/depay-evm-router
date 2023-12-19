import payWithExchangeConversion from '../_pay-with-exchange-conversion'

payWithExchangeConversion({
  blockchain: 'optimism',
  fromToken: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', // USDT
  fromAccount: '0x18709E89BD403F470088aBDAcEbE86CC60dda12e', // needs to hold enough fromToken, will be impersonated
  toToken: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', // USDC
  exchanges: [
    { name: 'uniswap_v3', type: 'push' },
  ]
})
