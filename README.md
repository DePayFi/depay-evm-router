# DePay's Ethereum Router

Plugin based ethereum smart contract enabling various peer-to-peer transactions like:
Payments, Subscriptions, Sales, Swaps, Payroll and Credit.

## Deployments

#### Mainnet

[DePayRouterV1](XXX)

#### Ropsten

[DePayRouterV1](XXX)

## Summary

This set of smart contracts enables decentralized payments.

The main purpose of this smart contract evolves around the `route` function,
which allows a sender to route crypto assets while converting tokens as part of the same transaction if required.

This allows for ETH to ETH, tokenA to tokenA, ETH to tokenA, tokenA to ETH and tokenA to tokenB conversions as part of e.g. payments.

To increase functionalities and to enable more and future decentralized exchanges and protocols,
additional plugins can be added/approved by calling `approvePlugin`.

## Functionalities

### `route` Route Transactions

The main function to route transactions.

Arguments:

`path`: The path of the token conversion:

```
ETH to ETH: 
['0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE']

DEPAY to DEPAY: 
['0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb']

ETH to DEPAY: 
['0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', '0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb']

DEPAY to ETH: 
['0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb', '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE']

DEPAY to UNI (routing goes through WETH): 
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

### `approvePlugin` Approves a plugin.

`plugin`: Address for the plugin to be approved.

## Approved Plugins

### DePayRouterV1Payment01

Used to send a payment (ETH or any transferable token) to a receiver.

Sends the token of path at the last position (`path[path.length-1]`) for the amount at index 1 (`amounts[1]`) to the address at the last position (`addresses[addresses.length-1]`).

Can be used to perform token sales from decentralized exchanges to the sender by setting `addresses` to `[<sender address>]`.

Mainnet: [XXX](XXX)

Ropsten: [XXX](XXX)

### DePayRouterV1PaymentEvent01

Used to log a payment event on-chain if requested. If not required/requested, not using it does safe gas.

Emits a `Payment` event on the `DePayRouterV1PaymentEvent01` contract using `addresses[0]` as the `sender` of the event and `addresses[addresses.length-1]` as the `receiver` of the `Payment`.

Mainnet: [XXX](XXX)

Ropsten: [XXX](XXX)

### DePayRouterV1SaleEvent01

Used to log a sale event on-chain if requested. If not required/requested, not using it does safe gas.

Emits a `Sale` event on the `DePayRouterV1SaleEvent01` contract using `addresses[0]` as the `buyer`.

Mainnet: [XXX](XXX)

Ropsten: [XXX](XXX)

### DePayRouterV1Uniswap01

Swap tokenA to tokenB, ETH to tokenA or tokenA to ETH on Uniswap as part of the payment.

Swaps tokens according to provided `path` using the amount at index 0 (`amounts[0]`) as input amount,
the amount at index 1 (`amounts[1]`) as output amount and the amount at index 2 (`amount[2]`) as deadline.

Mainnet: [XXX](XXX)

Ropsten: [XXX](XXX)

### DePayRouterV1ApproveAndCallContractAddressAmount01

Call another smart contract to deposit an amount for a given address while making sure the amount passed to the contract is approved.

Approves the amount at index 1 of `amounts` (`amounts[1]`)
for the token at the last position of `path` (`path[path.length-1]`)
to be used by the smart contract at index 1 of `addresses` (`addresses[1]`).

Afterwards, calls the smart contract at index 1 of `addresses` (`addresses[1]`),
passing the address at index 0 of `addresses` (`addresses[0]`)
and passing the amount at index 1 of `amounts` (`amounts[1]`)
to the method with the signature provided in `data` at index 0 (`data[0]`).

Mainnet: [XXX](XXX)

Ropsten: [XXX](XXX)


## Examples

### tokenA to tokenB payment with smart contract receiver (e.g. staking pool)

Mainnet: [XXX](XXX)

Ropsten: [XXX](XXX)

`path` needs to go through tokenA -> WETH -> tokenB if executed by Uniswap.

Requires to approve token at first index of path to be approved for the payment protocol smart contract.

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

Mainnet: [XXX](XXX)

Ropsten: [XXX](XXX)

`path` needs to go through tokenA -> WETH -> tokenB if executed by Uniswap.

Requires to approve token at first index of path to be approved for the payment protocol smart contract.

Get amounts through the Uniswap router by passing the same `path` and the desired output amount to receive the required input amount.

```
value: 0

path: [0xdAC17F958D2ee523a2206206994597C13D831ec7,0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2,0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb]

amounts: [21722130874672503286,10000000000000000000,1711537544]

addresses: [0x08B277154218CCF3380CAE48d630DA13462E3950]

plugins: [0x2AAC8B0bCC52F0bA1d971FC91dD5d60101391f7F,0xa5eC11D6A58B5cC03d1F28DEbB5077d41287ACD2]

data: []
```

IMPORTANT: Don't forget to have the payment protocol address added at the end of `plugins`
to avoid depositing swaps into the payment contract itself (without performing a payment).

### tokenA to ETH payment

Mainnet: [XXX](XXX)

Ropsten: [XXX](XXX)

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

Mainnet: [XXX](XXX)

Ropsten: [XXX](XXX)

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

Mainnet: [XXX](XXX)

Ropsten: [XXX](XXX)

_Consider performing tokenA to tokenA transfers directly if you don't rely on any other plugins or the Payment event._

_Needs spending approval on tokenA contract first._

```
value: 0

path: [0x6b175474e89094c44da98b954eedeac495271d0f]

amounts: [10000000000000000,10000000000000000]

addresses: [0x08B277154218CCF3380CAE48d630DA13462E3950]

plugins: [0xa5eC11D6A58B5cC03d1F28DEbB5077d41287ACD2]

data: []
```

IMPORTANT: Don't forget to have the payment protocol address added at the end of `plugins`
to avoid depositing into the payment contract itself without performing a payment.

### ETH to ETH payment

Mainnet: [XXX](XXX)

Ropsten: [XXX](XXX)

_Consider performing ETH to ETH transfers directly if you don't rely on any other plugins or the Payment event._

```
value: 0.01

path: [0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE]

amounts: [10000000000000000,10000000000000000]

addresses: [0x08B277154218CCF3380CAE48d630DA13462E3950]

plugins: [0xa5eC11D6A58B5cC03d1F28DEbB5077d41287ACD2]

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
