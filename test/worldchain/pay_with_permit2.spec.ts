import payWithPermit2 from '../_pay-with-permit2'

payWithPermit2({
  blockchain: 'worldchain',
  token: '0x79A02482A880bCE3F13e09Da970dC34db4CD24d1', // USDCe
  tokenHolder: '0xDc927Bd56CF9DfC2e3779C7E3D6d28dA1C219969', // needs to hold enough fromToken, will be impersonated
})
