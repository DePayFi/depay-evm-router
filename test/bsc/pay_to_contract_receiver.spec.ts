import payToContractReceiver from '../_pay-to-contract-receiver'

payToContractReceiver({
  blockchain: 'bsc',
  fromToken: '0x55d398326f99059fF775485246999027B3197955', // USDT
  fromAccount: '0x8894E0a0c962CB723c1976a4421c95949bE2D4E3', // needs to hold enough fromToken, will be impersonated
  toToken: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', // USDC
  exchange: { name: 'pancakeswap', type: 'pull' },
})
