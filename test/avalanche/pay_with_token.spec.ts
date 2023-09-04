import payWithToken from '../_pay-with-token'

payWithToken({
  blockchain: 'avalanche',
  token: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', // USDT
  fromAccount: '0x6B365AF8d060E7F7989985D62485357E34e2e8f5',
  reversalReason: 'ERC20: transfer amount exceeds allowance',
})
