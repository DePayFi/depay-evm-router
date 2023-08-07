import payWithToken from '../_pay-with-token'

payWithToken({
  blockchain: 'gnosis',
  token: '0x4ECaBa5870353805a9F068101A40E0f32ed605C6', // USDT
  tokenHolder: '0x5bb83e95f63217cda6ae3d181ba580ef377d2109',
  tokenReversalReason: 'SafeERC20: low-level call failed',
})
