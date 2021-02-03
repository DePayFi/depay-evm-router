## Deployments

#### Mainnet

[DePayPaymentsV1](https://etherscan.io/address/0xa5ec11d6a58b5cc03d1f28debb5077d41287acd2)

#### Ropsten

[DePayPaymentsV1](https://ropsten.etherscan.io/address/0x39Ff997cf48B5DFd9A7C981c23Fae71320669694)

## Summary

This set of smart contracts enables decentralized payments.

The main purpose of this smart contract evolves around the `pay` function,
which allows a sender to pay a receiver while swapping tokens as part of the same transaction if required.

This enables ETH to ETH, tokenA to tokenA, ETH to tokenA, tokenA to ETH and tokenA to tokenB payments.

To increase functionalities and to enable more and future decentralized exchanges and protocols,
additional plugins can be added/approved by calling `approvePlugin`.

## Functionalities

### `pay` Sender pays a receiver

The main function to peform payments.

Arguments:

`path`: The path of the token conversion:

```
ETH to ETH payment: 
['0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE']

DEPAY to DEPAY payment: 
['0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb']

ETH to DEPAY payment: 
['0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', '0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb']

DEPAY to ETH payment: 
['0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb', '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE']

DEPAY to UNI payment (routing goes through WETH): 
['0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb', '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984']
```

`amounts`: Amounts passed to proccessors:

```
e.g. [amountIn, amountOut, deadline]
```

`addresses`: Addresses passed to proccessors:

```
e.g. [receiver]
or [for, smartContractReceiver]
```

`plugins`: List of plugins to be executed in the given order for this payment:

```
e.g. [uniswap,payment] to swap and pay
or [uniswap,contractCall] to swap and call another contract
```
See [Approved Plugins](#approved-plugins) for more details about available and approved plugins.

`data`: Additional data passed to the payment plugins (e.g. contract call signatures):

```
e.g. ["signatureOfSmartContractFunction(address,uint)"] receiving the payment
```

### `approvePlugin` Approves a payment plugin.

`plugin`: Address for the plugin to be approved.


## Approved Plugins

### DePayPaymentsV1

Used to send tokens (or ETH) to a receiver.

Sends the token of path at the last position (`path[path.length-1]`) for the amount at index 1 (`amounts[1]`) to the address at the last position (`addresses[addresses.length-1]`).

Mainnet: [0xa5ec11d6a58b5cc03d1f28debb5077d41287acd2](https://etherscan.io/address/0xa5ec11d6a58b5cc03d1f28debb5077d41287acd2)

Ropsten: [0x39Ff997cf48B5DFd9A7C981c23Fae71320669694](https://ropsten.etherscan.io/address/0x39Ff997cf48B5DFd9A7C981c23Fae71320669694)

### DePayPaymentsV1Uniswap01

Swap tokenA to tokenB, ETH to tokenA or tokenA to ETH on Uniswap as part of the payment.

Swaps tokens according to provided `path` using the amount at index 0 (`amounts[0]`) as input amount,
the amount at index 1 (`amounts[1]`) as output amount and the amount at index 2 (`amount[2]`) as deadline.

Mainnet: [0x2AAC8B0bCC52F0bA1d971FC91dD5d60101391f7F](https://etherscan.io/address/0x2aac8b0bcc52f0ba1d971fc91dd5d60101391f7f)

Ropsten: [0xc083313A3a77Ce99Bc03e072b5Bbb18FD0Fe0411](https://ropsten.etherscan.io/address/0xc083313A3a77Ce99Bc03e072b5Bbb18FD0Fe0411)

### DePayPaymentsV1ApproveAndCallContractAddressAmount01

Call another smart contract to deposit an amount for a given address while making sure the amount passed to the contract is approved.

Approves the amount at index 1 of `amounts` (`amounts[1]`)
for the token at the last position of `path` (`path[path.length-1]`)
to be used by the smart contract at index 1 of `addresses` (`addresses[1]`).

Afterwards, calls the smart contract at index 1 of `addresses` (`addresses[1]`),
passing the address at index 0 of `addresses` (`addresses[0]`)
and passing the amount at index 1 of `amounts` (`amounts[1]`)
to the method with the signature provided in `data` at index 0 (`data[0]`).

Mainnet: [0xAAFbF4dE32b55809A685FF4c1D3aC48345c79d99](https://etherscan.io/address/0xaafbf4de32b55809a685ff4c1d3ac48345c79d99)

Ropsten: [0xB85B8307A3ab932D769826Ade116dFd48602875F](https://ropsten.etherscan.io/address/0xB85B8307A3ab932D769826Ade116dFd48602875F)


## Examples

### tokenA to tokenB payment with smart contract receiver (e.g. staking pool)

https://ropsten.etherscan.io/tx/0x7239410d735016e84fc1cc59542e3a6af00c78d1817e6d60ef3bddc475fc734b

`path` needs to go through tokenA -> WETH -> tokenB if executed by Uniswap.

Requires to approve token at first index of path to be approved on Uniswap router for the payment protocol smart contract.

Get amounts through the Uniswap router by passing the same `path` and the desired output amount to receive the required input amount.

```
value: 0

path: [0xAb4c122a024FeB8Eb3A87fBc7044ad69E51645cB,0xc778417E063141139Fce010982780140Aa0cD5Ab,0x9c2Db0108d7C8baE8bE8928d151e0322F75e8Eea]

amounts: [553637000000000000000,1000000000000000000,1711537544]

addresses: [0x08B277154218CCF3380CAE48d630DA13462E3950,0x0d8A34Cb6c08Ec71eA8009DF725a779B1877d4c5]

plugins: [0xc083313A3a77Ce99Bc03e072b5Bbb18FD0Fe0411,0xB85B8307A3ab932D769826Ade116dFd48602875F]

data: ["depositFor(address,uint256)"]
```

### tokenA to tokenB payment

https://ropsten.etherscan.io/tx/0x43080d5d2761f9536a60cf0c2a72b86d39e2ced6789e7f0eb5630e94b62d2e47

`path` needs to go through tokenA -> WETH -> tokenB if executed by Uniswap.

Requires to approve token at first index of path to be approved on Uniswap router for the payment protocol smart contract.

Get amounts through the Uniswap router by passing the same `path` and the desired output amount to receive the required input amount.

```
value: 0

path: [0xab4c122a024feb8eb3a87fbc7044ad69e51645cb,0xc778417e063141139fce010982780140aa0cd5ab,0x1f9840a85d5af5bf1d1762f925bdaddc4201f984]

amounts: [17123169254163466721,7000000000000000,1711537544]

addresses: [0x08B277154218CCF3380CAE48d630DA13462E3950]

plugins: [0xc083313A3a77Ce99Bc03e072b5Bbb18FD0Fe0411,0x39Ff997cf48B5DFd9A7C981c23Fae71320669694]

data: []
```

IMPORTANT: Don't forget to have the payment protocol address added at the end of `plugins`
to avoid depositing swaps into the payment contract itself (without performing a payment).

### tokenA to ETH payment

https://ropsten.etherscan.io/tx/0x207f4259c9fe838934f7c7ee3f538ddfa2fe31ecca85d78510124f09ecf22ced

```
value: 0

path: [0xab4c122a024feb8eb3a87fbc7044ad69e51645cb,0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE]

amounts: [1623250000000000000000,10000000000000000,1711537544]

addresses: [0x08B277154218CCF3380CAE48d630DA13462E3950]

plugins: [0xc083313A3a77Ce99Bc03e072b5Bbb18FD0Fe0411,0x39Ff997cf48B5DFd9A7C981c23Fae71320669694]

data: []
```

IMPORTANT: Don't forget to have the payment protocol address added at the end of `plugins`
to avoid depositing swaps into the payment contract itself (without performing a payment).

### ETH to tokenA payment

https://ropsten.etherscan.io/tx/0x82a868645a48e9cff17147cb3ed6dc9e1aed4cbe0a2a9a6c3e7a84f3161714b4

```
value: 0.000149068600304723

path: [0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE,0xab4c122a024feb8eb3a87fbc7044ad69e51645cb]

amounts: [149068600304723,1000000000000000000,1711537544]

addresses: [0x08B277154218CCF3380CAE48d630DA13462E3950]

plugins: [0xc083313A3a77Ce99Bc03e072b5Bbb18FD0Fe0411,0x39Ff997cf48B5DFd9A7C981c23Fae71320669694]

data: []
```

IMPORTANT: Don't forget to have the payment protocol address added at the end of `plugins`
to avoid depositing swaps into the payment contract itself (without performing a payment).

### tokenA to tokenA payment

https://ropsten.etherscan.io/tx/0xde5706eaa6422204b80e05f90cadfffae31111fa5c94bb6253ea550c29537e90

_Consider performing tokenA to tokenA transfers directly if you don't rely on any other plugins or the Payment event._

_Needs spending approval on tokenA contract first._

```
value: 0

path: [0xab4c122a024feb8eb3a87fbc7044ad69e51645cb]

amounts: [10000000000000000,10000000000000000]

addresses: [0x08B277154218CCF3380CAE48d630DA13462E3950]

plugins: [0x39Ff997cf48B5DFd9A7C981c23Fae71320669694]

data: []
```

IMPORTANT: Don't forget to have the payment protocol address added at the end of `plugins`
to avoid depositing into the payment contract itself without performing a payment.

### ETH to ETH payment

https://ropsten.etherscan.io/tx/0x2bd160ad92fd03f47f23d10c7d27c9e09c10721740e48e15f2d2ba032e1160c8

_Consider performing ETH to ETH transfers directly if you don't rely on any other plugins or the Payment event._

```
value: 0.01

path: [0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE]

amounts: [10000000000000000,10000000000000000]

addresses: [0x08B277154218CCF3380CAE48d630DA13462E3950]

plugins: [0x39Ff997cf48B5DFd9A7C981c23Fae71320669694]

data: []
```

IMPORTANT: Don't forget to have the payment protocol address added at the end of `plugins`
to avoid just depositing into the payment contract itself without performing a payment.

## Security Audits

1. https://github.com/DePayFi/depay-ethereum-payments/blob/master/docs/Audit1.md
2. https://github.com/DePayFi/depay-ethereum-payments/blob/master/docs/Audit2.md
3. https://github.com/DePayFi/depay-ethereum-payments/blob/master/docs/Audit3.md

## Development

### Quick Start

```
yarn install
yarn test
```

### Deploy

1. `yarn flatten`

2. Deploy flatten contract via https://remix.ethereum.org/
