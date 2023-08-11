import payWithToken from '../_pay-with-token'

payWithToken({
  blockchain: 'arbitrum',
  token: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // USDT
  fromAccount: '0xb38e8c17e38363af6ebdcb3dae12e0243582891d',
  reversalReason: 'ERC20: transfer amount exceeds allowance',
})
