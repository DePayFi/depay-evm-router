import payWithToken from '../_pay-with-token'

payWithToken({
  blockchain: 'fantom',
  token: '0xdc301622e621166BD8E82f2cA0A26c13Ad0BE355', // FRAX
  fromAccount: '0xd6e2F33B33271E97c4011218b88e334448818689',
  reversalReason: 'ERC20: transfer amount exceeds allowance',
})
