import payToContractReceiver from '../_pay-to-contract-receiver'

payToContractReceiver({
  blockchain: 'avalanche',
  fromToken: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', // USDT
  fromAccount: '0x6B365AF8d060E7F7989985D62485357E34e2e8f5', // needs to hold enough fromToken, will be impersonated
  toToken: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // USDC
  exchange: { name: 'trader_joe_v2_1', type: 'pull' },
})
