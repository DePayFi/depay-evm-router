## Deployments

#### Mainnet

#### Ropsten

[DePayPaymentsV1](https://ropsten.etherscan.io/address/0xCEf6dc2e210d1dD29A71185B33cE7002611C010A)

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
['0x0000000000000000000000000000000000000000']

DEPAY to DEPAY payment: 
['0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb']

ETH to DEPAY payment: 
['0x0000000000000000000000000000000000000000', '0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb']

DEPAY to ETH payment: 
['0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb', '0x0000000000000000000000000000000000000000']

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

Mainnet: 

Ropsten: [0xCEf6dc2e210d1dD29A71185B33cE7002611C010A](https://ropsten.etherscan.io/address/0xCEf6dc2e210d1dD29A71185B33cE7002611C010A)

### DePayPaymentsV1Uniswap01

Swap tokenA to tokenB, ETH to tokenA or tokenA to ETH on Uniswap as part of the payment.

Swaps tokens according to provided `path` using the amount at index 0 (`amounts[0]`) as input amount,
the amount at index 1 (`amounts[1]`) as output amount and the amount at index 2 (`amount[2]`) as deadline.

Mainnet: 

Ropsten: [0xf282bb5B1DeD20aC12204e03837E7C5b75c8cAeC](https://ropsten.etherscan.io/address/0xf282bb5B1DeD20aC12204e03837E7C5b75c8cAeC)

### DePayPaymentsV1ApproveAndCallContractAddressAmount01

Call another smart contract to deposit an amount for a given address while making sure the amount passed to the contract is approved.

Approves the amount at index 1 of `amounts` (`amounts[1]`)
for the token at the last position of `path` (`path[path.length-1]`)
to be used by the smart contract at index 1 of `addresses` (`addresses[1]`).

Afterwards, calls the smart contract at index 1 of `addresses` (`addresses[1]`),
passing the address at index 0 of `addresses` (`addresses[0]`)
and passing the amount at index 1 of `amounts` (`amounts[1]`)
to the method with the signature provided in `data` at index 0 (`data[0]`).

Mainnet: 

Ropsten: [0xaECF51376f9C3C632648cD63b8b6d4AC9739B578](https://ropsten.etherscan.io/address/0xaECF51376f9C3C632648cD63b8b6d4AC9739B578)


## Examples

### tokenA to tokenB payment with smart contract receiver (e.g. staking pool)

https://ropsten.etherscan.io/tx/0xaa9b657bbe2d07895476965acb8420ecf47fec8cbda2986360698540ace33b02

`path` needs to go through tokenA -> WETH -> tokenB if executed by Uniswap.

Requires to approve token at first index of path to be approved on Uniswap router for the payment protocol smart contract.

Get amounts through the Uniswap router by passing the same `path` and the desired output amount to receive the required input amount.

```
value: 0

path: [0xAb4c122a024FeB8Eb3A87fBc7044ad69E51645cB,0xc778417E063141139Fce010982780140Aa0cD5Ab,0x9c2Db0108d7C8baE8bE8928d151e0322F75e8Eea]

amounts: [153382175492087911584,1000000000000000000,1711537544]

addresses: [0x08B277154218CCF3380CAE48d630DA13462E3950,0x0d8A34Cb6c08Ec71eA8009DF725a779B1877d4c5]

plugins: [0xf282bb5B1DeD20aC12204e03837E7C5b75c8cAeC,0xaECF51376f9C3C632648cD63b8b6d4AC9739B578]

data: ["depositFor(address,uint256)"]
```

### tokenA to tokenB payment

https://ropsten.etherscan.io/tx/0xb322507f72827af2ca4af13d4b809d357cac6caeac091079fa8ff25659088594

`path` needs to go through tokenA -> WETH -> tokenB if executed by Uniswap.

Requires to approve token at first index of path to be approved on Uniswap router for the payment protocol smart contract.

Get amounts through the Uniswap router by passing the same `path` and the desired output amount to receive the required input amount.

```
value: 0

path: [0xab4c122a024feb8eb3a87fbc7044ad69e51645cb,0xc778417e063141139fce010982780140aa0cd5ab,0x1f9840a85d5af5bf1d1762f925bdaddc4201f984]

amounts: [17123169254163466721,7000000000000000,1711537544]

addresses: [0x08B277154218CCF3380CAE48d630DA13462E3950]

plugins: [0xf282bb5B1DeD20aC12204e03837E7C5b75c8cAeC,0xCEf6dc2e210d1dD29A71185B33cE7002611C010A]

data: []
```

IMPORTANT: Don't forget to have the payment protocol address added at the end of `plugins`
to avoid depositing swaps into the payment contract itself (without performing a payment).

### tokenA to ETH payment

https://ropsten.etherscan.io/tx/0x73a89ebecf70d70f4f7a9a2b87847cd584edecda870637c1bf828e3ac1855106

```
value: 0

path: [0xab4c122a024feb8eb3a87fbc7044ad69e51645cb,0x0000000000000000000000000000000000000000]

amounts: [57990288869539740958,10000000000000000,1711537544]

addresses: [0x08B277154218CCF3380CAE48d630DA13462E3950]

plugins: [0xf282bb5B1DeD20aC12204e03837E7C5b75c8cAeC,0xCEf6dc2e210d1dD29A71185B33cE7002611C010A]

data: []
```

IMPORTANT: Don't forget to have the payment protocol address added at the end of `plugins`
to avoid depositing swaps into the payment contract itself (without performing a payment).

### ETH to tokenA payment

https://ropsten.etherscan.io/tx/0x680abb0202c732299c9d4ce3f83fe44c9f7df399e339aaf881d1d2155759d406

```
value: 0.000149068600304723

path: [0x0000000000000000000000000000000000000000,0xab4c122a024feb8eb3a87fbc7044ad69e51645cb]

amounts: [149068600304723,1000000000000000000,1711537544]

addresses: [0x08B277154218CCF3380CAE48d630DA13462E3950]

plugins: [0xf282bb5B1DeD20aC12204e03837E7C5b75c8cAeC,0xCEf6dc2e210d1dD29A71185B33cE7002611C010A]

data: []
```

IMPORTANT: Don't forget to have the payment protocol address added at the end of `plugins`
to avoid depositing swaps into the payment contract itself (without performing a payment).

### tokenA to tokenA payment

https://ropsten.etherscan.io/tx/0xe9d3369e7c2126b8d6280f89e37c1679ce4ef97f68c220f1fb811f776f095b6f

_Consider performing tokenA to tokenA transfers directly if you don't rely on any other plugins or the Payment event._

_Needs spending approval on tokenA contract first._

```
value: 0

path: [0xab4c122a024feb8eb3a87fbc7044ad69e51645cb]

amounts: [10000000000000000,10000000000000000]

addresses: [0x08B277154218CCF3380CAE48d630DA13462E3950]

plugins: [0xCEf6dc2e210d1dD29A71185B33cE7002611C010A]

data: []
```

IMPORTANT: Don't forget to have the payment protocol address added at the end of `plugins`
to avoid depositing into the payment contract itself without performing a payment.

### ETH to ETH payment

https://ropsten.etherscan.io/tx/0x84fa9fcc783df562759d99324a8f7aaa574908618c071cdb7cb30afd07f503e5

_Consider performing ETH to ETH transfers directly if you don't rely on any other plugins or the Payment event._

```
value: 0.01

path: [0x0000000000000000000000000000000000000000]

amounts: [10000000000000000,10000000000000000]

addresses: [0x08B277154218CCF3380CAE48d630DA13462E3950]

plugins: [0xCEf6dc2e210d1dD29A71185B33cE7002611C010A]

data: []
```

IMPORTANT: Don't forget to have the payment protocol address added at the end of `plugins`
to avoid just depositing into the payment contract itself without performing a payment.

## Security Audits

1. https://github.com/DePayFi/depay-ethereum-payments/Audit1.md
2. https://github.com/DePayFi/depay-ethereum-payments/Audit2.md
3. ...

## Development

### Quick Start

```
yarn install
yarn test
```

### Deploy

1. `yarn flatten`

2. Deploy flatten contract via https://remix.ethereum.org/
