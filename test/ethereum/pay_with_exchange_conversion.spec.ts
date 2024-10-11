import payWithExchangeConversion from '../_pay-with-exchange-conversion'

payWithExchangeConversion({
  blockchain: 'ethereum',
  fromToken: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  fromAccount: '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503', // needs to hold enough fromToken, will be impersonated
  toToken: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52',
  exchanges: [
    { name: 'uniswap_v2', type: 'pull' },
    { name: 'uniswap_v3', type: 'pull' }
  ]
})
