import payWithToken from '../_pay-with-token'

payWithToken({
  blockchain: 'gnosis',
  token: '0x4ECaBa5870353805a9F068101A40E0f32ed605C6', // USDT
  fromAccount: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
  reversalReason: 'SafeERC20: low-level call failed',
})
