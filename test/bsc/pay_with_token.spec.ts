import payWithToken from '../_pay-with-token'

payWithToken({
  blockchain: 'bsc',
  token: '0x55d398326f99059fF775485246999027B3197955', // USDT
  fromAccount: '0x8894E0a0c962CB723c1976a4421c95949bE2D4E3',
  reversalReason: 'BEP20: transfer amount exceeds allowance',
})
