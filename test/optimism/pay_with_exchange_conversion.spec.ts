import payWithExchangeConversion from '../_pay-with-exchange-conversion'

payWithExchangeConversion({
  blockchain: 'optimism',
  fromToken: '0x4200000000000000000000000000000000000042', // OP
  fromAccount: '0xd80E867CDDDa0B49a6EFcEa45d51cd5EE222b7e7', // needs to hold enough fromToken, will be impersonated
  toToken: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', // USDC
  exchanges: [
    { name: 'uniswap_v3', type: 'push' },
  ]
})
