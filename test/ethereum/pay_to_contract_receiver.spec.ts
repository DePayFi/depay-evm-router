import payToContractReceiver from '../_pay-to-contract-receiver'

payToContractReceiver({
  blockchain: 'ethereum',
  fromToken: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
  fromAccount: '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503', // needs to hold enough fromToken, will be impersonated
  toToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
  exchange: { name: 'uniswap_v2', type: 'pull' },
})
