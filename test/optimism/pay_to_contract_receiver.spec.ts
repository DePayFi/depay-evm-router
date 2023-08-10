import payToContractReceiver from '../_pay-to-contract-receiver'

payToContractReceiver({
  blockchain: 'optimism',
  fromToken: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', // USDT
  fromAccount: '0xacD03D601e5bB1B275Bb94076fF46ED9D753435A', // needs to hold enough fromToken, will be impersonated
  toToken: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', // USDC
  exchange: { name: 'uniswap_v3', type: 'push' },
})
