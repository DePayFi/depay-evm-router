import payWithToken from '../_pay-with-token'

payWithToken({
  blockchain: 'fantom',
  token: '0x841FAD6EAe12c286d1Fd18d1d525DFfA75C7EFFE', // BOO
  fromAccount: '0xf778F4D7a14A8CB73d5261f9C61970ef4E7D7842',
  reversalReason: 'WERC10: request exceeds allowance',
})
