import payWithToken from '../_pay-with-token'

payWithToken({
  blockchain: 'fantom',
  token: '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75', // USDC
  fromAccount: '0x3381b11f6865f23e0Ad37A92B4CD4aEBe9E4f86a',
  reversalReason: 'WERC10: request exceeds allowance',
})
