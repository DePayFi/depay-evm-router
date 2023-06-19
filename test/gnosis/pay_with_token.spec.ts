import payWithToken from '../_pay-with-token'

payWithToken({
  blockchain: 'gnosis',
  token: '0x4ECaBa5870353805a9F068101A40E0f32ed605C6', // USDT
  tokenHolder: '0x6c5bb1514f2f8f0256cbb4570860f90b288e29f4',
  tokenReversalReason: 'SafeERC20: low-level call failed',
})
