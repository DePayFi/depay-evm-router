import payWithExchangeConversion from '../_pay-with-exchange-conversion'

payWithExchangeConversion({
  blockchain: 'fantom',
  fromToken: '0x321162Cd933E2Be498Cd2267a90534A804051b11', // WBTC
  fromAccount: '0x632085aA7924DF37f64950C58B9Fe5D9fDBA80ef', // needs to hold enough fromToken, will be impersonated
  toToken: '0x841FAD6EAe12c286d1Fd18d1d525DFfA75C7EFFE', // BOO
  exchanges: [
    { name: 'spookyswap', type: 'pull' },
  ]
})
