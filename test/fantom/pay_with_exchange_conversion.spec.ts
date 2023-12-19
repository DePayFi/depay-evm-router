import payWithExchangeConversion from '../_pay-with-exchange-conversion'

payWithExchangeConversion({
  blockchain: 'fantom',
  fromToken: '0x9879aBDea01a879644185341F7aF7d8343556B7a', // TUSD
  fromAccount: '0x98bEDd08B149eD859d879930AD007229BA5B18C9', // needs to hold enough fromToken, will be impersonated
  toToken: '0x841FAD6EAe12c286d1Fd18d1d525DFfA75C7EFFE', // BOO
  exchanges: [
    { name: 'spookyswap', type: 'pull' },
  ]
})
