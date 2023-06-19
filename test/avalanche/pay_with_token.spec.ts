import payWithToken from '../_pay-with-token'

payWithToken({
  blockchain: 'avalanche',
  token: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', // USDT
  tokenHolder: '0x9f8c163cba728e99993abe7495f06c0a3c8ac8b9',
  tokenReversalReason: 'ERC20: transfer amount exceeds allowance',
})
