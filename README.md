# DePay's EVM Web3 Payment Router.

## Deployments

Optimization Level: 800,000

### DePayRouterV3

Enables Web3 Payments.

Ethereum:
- [](https://etherscan.io/address/)

BNB Smart Chain:
- [](https://bscscan.com/address/)

Polygon (POS):
- [](https://polygonscan.com/address/)

Avalanche:
- [](https://snowtrace.io/address/)

Fantom:
- [](https://ftmscan.com/address/)

Gnosis:
- [](https://gnosisscan.io/address/)

Optimism:
- [](https://optimistic.etherscan.io/address/)

Arbitrum:
- [](https://arbiscan.io/address/)

Base:
- [](https://basescan.org/address/)

Worldchain:
- [0x0Dfb7137bC64b63F7a0de7Cb9CDa178702666220](https://worldchain-mainnet.explorer.alchemy.com/address/0x0Dfb7137bC64b63F7a0de7Cb9CDa178702666220)

### DePayForwarderV3

DePayForwarderV2 allows to pay into smart contracts.

Ethereum:
- [](https://etherscan.io/address/)

BNB Smart Chain:
- [](https://bscscan.com/address/)

Polygon (POS):
- [](https://polygonscan.com/address/)

Avalanche:
- [](https://snowtrace.io/address/)

Fantom:
- [](https://ftmscan.com/address/)

Gnosis:
- [](https://gnosisscan.io/address/)

Optimism: 
- [](https://optimistic.etherscan.io/address/)

Arbitrum:
- [](https://arbiscan.io/address/)

Base:
- [](https://basescan.org/address/)

Worldchain:
- [0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb](https://worldchain-mainnet.explorer.alchemy.com/address/0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb)

### DePayWETHExchangeV1

DePayWETHExchangeV1 allows to swap WETH<>ETH both ways when performing payments using the DePay Router.

Ethereum:
- [0x298f4980525594b3b982779cf74ba76819708D43](https://etherscan.io/address/0x298f4980525594b3b982779cf74ba76819708D43)

BNB Smart Chain:
- [0xeEb80d14abfB058AA78DE38813fe705c3e3b243E](https://bscscan.com/address/0xeEb80d14abfB058AA78DE38813fe705c3e3b243E)

Polygon (POS):
- [0xaE59C9d3E055BdFAa583E169aA5Ebe395689476a](https://polygonscan.com/address/0xaE59C9d3E055BdFAa583E169aA5Ebe395689476a)

Avalanche:
- [0x2d0a6275eaDa0d03226919ce6D93661E589B2d59](https://snowtrace.io/address/0x2d0a6275eaDa0d03226919ce6D93661E589B2d59)

Fantom:
- [0x2d0a6275eaDa0d03226919ce6D93661E589B2d59](https://ftmscan.com/address/0x2d0a6275eaDa0d03226919ce6D93661E589B2d59)

Gnosis:
- [0x2d0a6275eaDa0d03226919ce6D93661E589B2d59](https://gnosisscan.io/address/0x2d0a6275eaDa0d03226919ce6D93661E589B2d59)

Optimism: 
- [0x69594057e2C0224deb1180c7a5Df9ec9d5B611B5](https://optimistic.etherscan.io/address/0x69594057e2C0224deb1180c7a5Df9ec9d5B611B5)

Arbitrum:
- [0x7E655088214d0657251A51aDccE9109CFd23B5B5](https://arbiscan.io/address/0x7E655088214d0657251A51aDccE9109CFd23B5B5)

Base:
- [0xD1711710843B125a6a01FfDF9b95fDc3064BeF7A](https://basescan.org/address/0xD1711710843B125a6a01FfDF9b95fDc3064BeF7A)

Worldchain:
- [0x2CA727BC33915823e3D05fe043d310B8c5b2dC5b](https://worldchain-mainnet.explorer.alchemy.com/address/0x2CA727BC33915823e3D05fe043d310B8c5b2dC5b)

## Functionalities

### pay

The DePay Router smart contract enables decentralized payments with auto-conversion, payment- and protocol-fees.

The main purpose of the DePay Router evolves around the `pay` function.

The DePay Router allows for the following payments:
  
  - NATIVE to NATIVE
  - NATIVE to TOKEN
  - TOKEN to NATIVE
  - TOKEN to WRAPPED
  - WRAPPED to NATIVE
  - WRAPPED to TOKEN
  - NATIVE to WRAPPED
  - TOKEN_A to TOKEN_B

The DePay Router offers 3 different `pay` functions which are overloaded and to be differentiated by their method arguments.

The pay funciton of the DePay Router requires a `Payment` struct in order to process a payment. The struct is assembled as follows:

```
struct Payment {
  uint256 amountIn;
  uint256 paymentAmount;
  uint256 feeAmount;
  uint256 protocolAmount;
  uint256 deadline; // in milliseconds!
  address tokenInAddress;
  address exchangeAddress;
  address tokenOutAddress;
  address paymentReceiverAddress;
  address feeReceiverAddress;
  uint8 exchangeType;
  uint8 receiverType;
  bool permit2;
  bytes exchangeCallData;
  bytes receiverCallData;
}
```

#### pay - without any prior approval

Using a blockchains native currency to perform a payment using the DePay Router's `pay` function does not require any upfront approval.

This means payments from:

- NATIVE to NATIVE
- NATIVE to token
- NATIVE to WRAPPED

can be performed without any prior approval or signature.

```
function pay(
  Payment calldata payment
) external payable returns(bool);
```

```
pay(
  (uint256,uint256,uint256,uint256,uint256,address,address,address,address,address,uint8,uint8,bool,bytes,bytes)
)
```

```javascript
router.connect(senderWallet)[
  "pay((uint256,uint256,uint256,uint256,uint256,address,address,address,address,address,uint8,uint8,bool,bytes,bytes))"
]({
  amountIn: "1000000000",
  paymentAmount: "1000000000",
  feeAmount: "0",
  protocolAmount: "0",
  deadline: "1727680659852",
  tokenInAddress: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  exchangeAddress: "0x0000000000000000000000000000000000000000",
  tokenOutAddress: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  paymentReceiverAddress: receiverWallet,
  feeReceiverAddress: "0x0000000000000000000000000000000000000000",
  exchangeType: 0,
  receiverType: 0,
  permit2: false,
  exchangeCallData: "0x",
  receiverCallData: "0x",
}, { value: "1000000000" })
```

#### pay - with permit2 SignatureTransfer

The `pay` function in the DePay Router enables token-based payments, which can be enabled by upfront [permit2 SignatureTransfers](https://docs.uniswap.org/contracts/permit2/reference/signature-transfer).

Once the payment sender has allowed the permit2 contract as a spender for a given token and signed a permit2 SignatureTransfer for the DePay Router, the following payments can be performed:

- TOKEN to NATIVE
- TOKEN to WRAPPED
- TOKEN_A to TOKEN_B
- WRAPPED to NATIVE
- WRAPPED to TOKEN

```
struct TokenPermissions {
  address token;
  uint256 amount;
}

struct PermitTransferFrom {
  TokenPermissions permitted;
  uint256 nonce;
  uint256 deadline;
}

struct PermitTransferFromAndSignature {
  IPermit2.PermitTransferFrom permitTransferFrom;
  bytes signature;
}

function pay(
  IDePayRouterV3.Payment calldata payment,
  PermitTransferFromAndSignature calldata permitTransferFromAndSignature
) external payable returns(bool);
```

```
pay(
  (uint256,uint256,uint256,uint256,uint256,address,address,address,address,address,uint8,uint8,bool,bytes,bytes),
  (
    (
      (address,uint256),
      uint256,
      uint256
    ),
    bytes
  )
)
```

```javascript
const domain = {
  chainId: "10", // e.g. optimism
  name: "Permit2",
  verifyingContract: permit2Contract.address
}

const types = {
  PermitTransferFrom: [
    { name: "permitted", type: "TokenPermissions" },
    { name: "spender", type: "address" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" }
  ],
  TokenPermissions: [
    { name: "token", type: "address" },
    { name: "amount", type: "uint256" },
  ]
}

const data = {
  permitted: {
    token: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    amount: "100000",
  },
  spender: routerAddress,
  nonce,
  deadline
}

const signature = await wallets[0]._signTypedData(domain, types, data)

router.connect(senderWallet)[
  "pay((uint256,uint256,uint256,uint256,uint256,address,address,address,address,address,uint8,uint8,bool,bytes,bytes),(((address,uint256),uint256,uint256),bytes))"
](
  { // payment
    amountIn: "100000",
    paymentAmount: "100000",
    feeAmount: "0",
    protocolAmount: "0",
    deadline: "1727680659852",
    tokenInAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    exchangeAddress: "0x0000000000000000000000000000000000000000",
    tokenOutAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    paymentReceiverAddress: receiverWallet,
    feeReceiverAddress: "0x0000000000000000000000000000000000000000",
    exchangeType: 0,
    receiverType: 0,
    permit2: true,
    exchangeCallData: "0x",
    receiverCallData: "0x",
  },
  { // PermitTransferFromAndSignature
    permitTransferFrom: {
       permitted: {
        token: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        amount: "100000",
      },
      nonce,
      deadline
    },
    signature
  },
  { value: 0 }
)
```

#### pay - with ERC-20 token approval

The `pay` function in the DePay Router enables token-based payments, which can be enabled by upfront [ERC-20 token approvals](https://docs.openzeppelin.com/contracts/2.x/api/token/erc20#IERC20-approve-address-uint256-).

Once the payment sender has allowed the DePay Router as a spender for a given token, the following payments can be performed:

- TOKEN to NATIVE
- TOKEN to WRAPPED
- TOKEN_A to TOKEN_B
- WRAPPED to NATIVE
- WRAPPED to TOKEN

```
function pay(
  Payment calldata payment
) external payable returns(bool);
```

```
pay(
  (uint256,uint256,uint256,uint256,uint256,address,address,address,address,address,uint8,uint8,bool,bytes,bytes)
)
```

```javascript
const PAY = "pay((uint256,uint256,uint256,uint256,uint256,address,address,address,address,address,uint8,uint8,bool,bytes,bytes))"

router.connect(senderWallet)[PAY]({
  amountIn: "100000",
  paymentAmount: "100000",
  feeAmount: "0",
  protocolAmount: "0",
  deadline: "1727680659852",
  tokenInAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  exchangeAddress: "0x0000000000000000000000000000000000000000",
  tokenOutAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  paymentReceiverAddress: receiverWallet,
  feeReceiverAddress: "0x0000000000000000000000000000000000000000",
  exchangeType: 0,
  receiverType: 0,
  permit2: false,
  exchangeCallData: "0x",
  receiverCallData: "0x",
}, { value: 0 })
```

### Payment Event

The `DePayRouterV3` emits a `Payment` event for all payments:

```
event Payment(
  address indexed from,
  address indexed to,
  uint256 indexed deadline,
  uint256 amountIn,
  uint256 paymentAmount,
  uint256 feeAmount,
  uint256 protocolAmount,
  uint256 slippageAmount,
  address tokenInAddress,
  address tokenOutAddress,
  address feeReceiverAddress
);
```

## Development

Create an `.env` file with the following content:
```
NODE_ENV=development

MNEMONIC="shine romance erase resource daring bean talk right cupboard visa renew galaxy"
#(0) 0xdde3dc4308A7856D49D1d7303bB630Bccb45Caf9
#(1) 0x26Fe22F655303151C2ef3b2D097F842ab27Ef940
#(2) 0x877a79C20028F9ef81e956B43B917703cC22A07A
#(3) 0x3a36b51c5125A9c064f4Cd2F492989618CF7660E

ARBITRUM_NOVA_RPC_URL=https://arbitrum-nova.blastapi.io/<APIKEY>
ARBITRUM_ONE_RPC_URL=https://arbitrum-one.blastapi.io/<APIKEY>
AVALANCHE_RPC_URL=https://ava-mainnet.blastapi.io/<APIKEY>/ext/bc/C/rpc
BSC_RPC_URL=https://bsc-mainnet.blastapi.io/<APIKEY>
ETHEREUM_RPC_URL=https://eth-mainnet.blastapi.io/<APIKEY>
FANTOM_RPC_URL=https://fantom-mainnet.blastapi.io/<APIKEY>
GNOSIS_RPC_URL=https://gnosis-mainnet.blastapi.io/<APIKEY>
OPTIMISM_RPC_URL=https://optimism.blockpi.network/v1/rpc/public
POLYGON_RPC_URL=https://polygon-mainnet.blastapi.io/<APIKEY>
POLYGON_ZKEVM_RPC_URL=https://polygon-zkevm-mainnet.blastapi.io/<APIKEY>
ZKSYNC_ERA_RPC_URL=https://mainnet.era.zksync.io
```

### Quick Start

```
yarn install
yarn test
```

### Testing

Test on a specific chain:
```
yarn test:<chain>
```

e.g. `ethereum`, `bsc` etc.

Test on all blockchains:

```
yarn test
```

Test single files:

```
npx hardhat test test/ethereum/pay_with_exchange_conversion.spec.ts --config hardhat.config.ethereum.ts
```

### Deploy

1. `yarn flatten`

2. Deploy flatten contract

