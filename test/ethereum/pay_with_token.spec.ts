import payWithToken from '../_pay-with-token'

payWithToken({
  blockchain: 'ethereum',
  token: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
  fromAccount: '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503',
  reversalReason: 'SafeERC20: low-level call failed',
})
