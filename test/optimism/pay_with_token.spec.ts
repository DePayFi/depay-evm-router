import payWithToken from '../_pay-with-token'

payWithToken({
  blockchain: 'optimism',
  token: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', // USDT
  fromAccount: '0xacd03d601e5bb1b275bb94076ff46ed9d753435a',
  reversalReason: 'ERC20: transfer amount exceeds allowance',
})
