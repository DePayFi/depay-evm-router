import payWithToken from '../_pay-with-token'

payWithToken({
  blockchain: 'polygon',
  token: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // USDT
  fromAccount: '0xF977814e90dA44bFA03b6295A0616a897441aceC',
  reversalReason: 'ERC20: transfer amount exceeds allowance',
})
