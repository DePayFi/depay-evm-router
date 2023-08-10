import payWithPermit2 from '../_pay-with-permit2'

payWithPermit2({
  blockchain: 'ethereum',
  fromToken: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
  fromAccount: '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503', // needs to hold enough fromToken, will be impersonated
})
