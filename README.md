## Deployments

#### Mainnet

#### Ropsten

[DePayPaymentProcessorV1](https://ropsten.etherscan.io/address/0xcd1a015321b183cb5ea046a4c80dd6e88b89f3b5)

## Summary

This smart contract enables decentralized payment processing.

The main purpose of this smart contract evolves around the `pay` function,
which allows a sender to pay a receiver while swapping tokens as part of the same transaction if required.

This enables ETH to ETH, tokenA to tokenA, ETH to tokenA, tokenA to ETH and tokenA to tokenB payments.

To increase functionalities and to enable more and future decentralized exchanges and protocols,
additional processors can be added/approved by calling `approveProcessor`.

## Functionalities

### `pay` Sender pays a receiver

The main function to process payments.

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

DEPAY to UNI payment (processing goes through WETH): 
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

`processors`: List and order of processors to be executed for this payment:

```
e.g. [uniswapProcessor,paymentProcessor] to swap and pay
or [uniswapProcessor,callContractProcessor] to swap and call another contract
```
See [Approved Processors](#approved-processors) for more details about available and approved processors.

`data`: List and order of processors to be executed for this payment:

```
e.g. ["signatureOfSmartContractFunction(address,uint)"] receiving the payment
```

### `approveProcessor` Approves a payment processor.

`processor`: Address for the processor to be approved.


## Approved Processors

### DePayPaymentProcessorV1

Used to send tokens (or ETH) to a receiver.

Sends the token of path at the last position (`path[path.length-1]`) for the amount at index 1 (`amounts[1]`) to the address at the last position (`addresses[addresses.length-1]`).

Mainnet: 

Ropsten: [0xcd1A015321B183cB5Ea046a4C80dd6E88B89F3b5](https://ropsten.etherscan.io/address/0xcd1a015321b183cb5ea046a4c80dd6e88b89f3b5)

### DePayPaymentProcessorV1Uniswap01

Swap tokenA<>tokenB, ETH<>tokenA or tokenA<>ETH on Uniswap as part of the payment.

Swaps tokens according to provided `path` using the amount at index 0 (`amounts[0]`) as input amount,
the amount at index 1 (`amounts[1]`) as output amount and the amount at index 2 (`amount[2]`) as deadline.

Mainnet: 

Ropsten: [0x80F43d58E068e04125B9688EE46821A42CD4c53E](https://ropsten.etherscan.io/address/0x80f43d58e068e04125b9688ee46821a42cd4c53e)

### DePayPaymentProcessorV1ApproveAndCallContractAddressAmount01

Call another smart contract to deposit an amount for a given address while making sure the amount passed to the contract is approved.

Approves the amount at index 1 of `amounts` (`amounts[1]`)
for the token at the last position of `path` (`path[path.length-1]`)
to be used by the smart contract at index 1 of `addresses` (`addresses[1]`).

Afterwards, calls the smart contract at index 1 of `addresses` (`addresses[1]`),
passing the address at index 0 of `addresses` (`addresses[0]`)
and passing the amount at index 1 of `amounts` (`amounts[1]`)
to the method with the signature provided in `data` at index 0 (`data[0]`).

Mainnet: 

Ropsten: [0xB55209ca3F7f7A85050C9642303c43996c31b99D](https://ropsten.etherscan.io/address/0xb55209ca3f7f7a85050c9642303c43996c31b99d)


## Examples

### tokenA to tokenB payment with smart contract receiver (e.g. staking pool)

https://ropsten.etherscan.io/tx/0xd284b953e2d2828c30aabf31e7399a3329a4b1be29e5b55470bf454345f22910

`path` needs to go through tokenA -> WETH -> tokenB if processed by Uniswap.

Requires to approve token at first index of path to be approved on Uniswap router for the payment processor smart contract.

Get amounts through the Uniswap router by passing the same `path` and the desired output amount to receive the required input amount.

```
value: 0

path: [0xAb4c122a024FeB8Eb3A87fBc7044ad69E51645cB,0xc778417E063141139Fce010982780140Aa0cD5Ab,0x9c2Db0108d7C8baE8bE8928d151e0322F75e8Eea]

amounts: [44412863949783468441,1000000000000000000,1711537544]

addresses: [0x08B277154218CCF3380CAE48d630DA13462E3950,0x0d8A34Cb6c08Ec71eA8009DF725a779B1877d4c5]

processors: [0x80F43d58E068e04125B9688EE46821A42CD4c53E,0xB55209ca3F7f7A85050C9642303c43996c31b99D]

data: ["depositFor(address,uint256)"]
```

### tokenA to tokenB payment

https://ropsten.etherscan.io/tx/0x8c990e33359d3b3166b782cd217059c4a9197b3a3b6688e4b301781fae31bd2a

`path` needs to go through tokenA -> WETH -> tokenB if processed by Uniswap.

Requires to approve token at first index of path to be approved on Uniswap router for the payment processor smart contract.

Get amounts through the Uniswap router by passing the same `path` and the desired output amount to receive the required input amount.

```
value: 0

path: [0xab4c122a024feb8eb3a87fbc7044ad69e51645cb,0xc778417e063141139fce010982780140aa0cd5ab,0x1f9840a85d5af5bf1d1762f925bdaddc4201f984]

amounts: [17123169254163466721,7000000000000000,1711537544]

addresses: [0x08B277154218CCF3380CAE48d630DA13462E3950]

processors: [0x80F43d58E068e04125B9688EE46821A42CD4c53E,0xcd1a015321b183cb5ea046a4c80dd6e88b89f3b5]

data: []
```

IMPORTANT: Don't forget to have the actually payment processor added at the end of `processors`
to avoid depositing swaps into the payment processor contract itself (without performing any payment).

### tokenA to ETH payment

https://ropsten.etherscan.io/tx/0x9db6ab92ad1f5cf3fc55ed89a6fc2f37c0b512e8983970bea31a7e75b6ae38d8

```
value: 0

path: [0xab4c122a024feb8eb3a87fbc7044ad69e51645cb,0x0000000000000000000000000000000000000000]

amounts: [26618972399173231429,10000000000000000,1711537544]

addresses: [0x08B277154218CCF3380CAE48d630DA13462E3950]

processors: [0x80F43d58E068e04125B9688EE46821A42CD4c53E,0xcd1a015321b183cb5ea046a4c80dd6e88b89f3b5]

data: []
```

IMPORTANT: Don't forget to have the actually payment processor added at the end of `processors`
to avoid depositing swaps into the payment processor contract itself (without performing any payment).

### ETH to tokenA payment

https://ropsten.etherscan.io/tx/0xc0db866d9c641404e7671966e6ecec5bf092dd73f3b5d64b60e1032da0da8ff8

```
value: 0.000341694208712148

path: [0x0000000000000000000000000000000000000000,0xab4c122a024feb8eb3a87fbc7044ad69e51645cb]

amounts: [341694208712148,1000000000000000000,1711537544]

addresses: [0x08B277154218CCF3380CAE48d630DA13462E3950]

processors: [0x80F43d58E068e04125B9688EE46821A42CD4c53E,0xcd1a015321b183cb5ea046a4c80dd6e88b89f3b5]

data: []
```

IMPORTANT: Don't forget to have the actually payment processor added at the end of `processors`
to avoid depositing swaps into the payment processor contract itself (without performing any payment).

### tokenA to tokenA payment

https://ropsten.etherscan.io/tx/0x00ed1b5b8f63e52fcda44abf07921a47912364b69de6f461e41cd4bcd2230d51

_Consider performing tokenA to tokenA transfers directly if you don't rely on any other processors or the Payment event._

_Needs spending approval on tokenA contract first._

```
value: 0

path: [0xab4c122a024feb8eb3a87fbc7044ad69e51645cb]

amounts: [10000000000000000,10000000000000000]

addresses: [0x08B277154218CCF3380CAE48d630DA13462E3950]

processors: [0xcd1a015321b183cb5ea046a4c80dd6e88b89f3b5]

data: []
```

IMPORTANT: Don't forget to have the actually payment processor added at the end of `processors`
to avoid depositing into the payment processor contract itself without performing any payment.

### ETH to ETH payment

https://ropsten.etherscan.io/tx/0x9d16069f2dabf774108ad36e585f16f42c6568bcea81b6f872a082affd9d3d99

_Consider performing ETH to ETH transfers directly if you don't rely on any other processors or the Payment event._

```
value: 0.01

path: [0x0000000000000000000000000000000000000000]

amounts: [10000000000000000,10000000000000000]

addresses: [0x08B277154218CCF3380CAE48d630DA13462E3950]

processors: [0xcd1a015321b183cb5ea046a4c80dd6e88b89f3b5]

data: []
```

IMPORTANT: Don't forget to have the actually payment processor added at the end of `processors`
to avoid just depositing into the payment processor contract itself without performing any payment.

## Security Audits

1. https://github.com/DePayFi/depay-ethereum-payment-processing/issues/3

## Development

### Quick Start

```
yarn install
yarn test
```

### Deploy

1. `yarn flatten`

2. Deploy flatten contract via https://remix.ethereum.org/
