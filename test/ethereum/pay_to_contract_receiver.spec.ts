import payToContractReceiver from '../_pay-to-contract-receiver'

payToContractReceiver({
  blockchain: 'ethereum',
  toToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
  exchanges: [
    { name: 'uniswap_v2', type: 'pull' },
  ]
})
