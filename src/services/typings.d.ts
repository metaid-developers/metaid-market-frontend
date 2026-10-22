declare namespace API {
  type Chain = "btc" | "mvc";
  type Network = "testnet" | "mainnet";
  type Order = {
    assetId: string;
    assetNumber: number;
    assetType: string;
    buyer: {
      avatar: string;
      name: string;
    };
    buyerAddress: "string";
    content: "string";
    detail: "string";
    fee: 0;
    feeRate: 0;
    orderId: "string";
    orderState: 1;
    outValue: 0;
    preview: "string";
    sellPriceAmount: 0;
    sellPriceCoin: "string";
    sellPriceDecimal: 0;
    seller: {
      avatar: "string";
      name: "string";
    };
    sellerAddress: "string";
    takePsbt: "string";
    utxoId: "string";
    info: {
      contentLength: 8872;
      contentTypeDetect: "image/jpeg";
      createAddress: "tb1ppkvfwnw67q4w8pt86l7wr3jkngsyymqucrn6vxak7zpntawm6n6qwz929l";
      encryption: "0";
      genesisHeight: 2815479;
      genesisTransaction: "c40f45989c8b856c8d2a55264410fe80e2ab083e5998227e72ecfe4212d21b7b";
      metaid: "61a61ef4a77c3a9e9df56d4946356a4562be6c0cfec1b1d1575dabce834f6c07";
      operation: "create";
      originalPath: "/info/avatar";
      outputValue: 546;
      path: "/info/avatar";
      pinId: "c40f45989c8b856c8d2a55264410fe80e2ab083e5998227e72ecfe4212d21b7bi0";
      pinNumber: 241;
      pop: "00000000000000000000414744640463645224350604423120243163610625751135332020373701650607700027655037672514010043015077050165311662043611213617662543775763056730135447264403";
      popLv: 3;
      popSummary: "00414744640463";
      timestamp: 1715777709;
      version: "1.0.0";
    };
    textContent: string;
  };
  interface ListRet<T> {
    data: {
      total: number;
      list: T[];
    };
    message: string;
    code: number;
  }

  interface Ret<T> {
    data: T;
    message: string;
    code: number;
  }
  type Tx = {
    address: string;
    value: number;
  };
  type UTXO = {
    txId: string;
    vout: number;
    outputIndex: number;
    satoshis: number;
    satoshi: number;
    confirmed: boolean;
    rawTx?: string;
    inscriptions?:
      | {
          id: string;
          num: number;
        }[]
      | null;
    runes?: RUNESItem[];
  };
  type Asset = {
    assetId: string;
    assetNumber: number;
    assetType: string;
    buyer: {
      avatar: string;
      name: string;
    };
    buyerAddress: "string";
    content: "string";
    detail: "string";
    fee: 0;
    feeRate: 0;
    orderId: string;
    orderState: 1;
    outValue: 0;
    preview: "string";
    sellPriceAmount: 0;
    sellPriceCoin: "string";
    sellPriceDecimal: 0;
    seller: {
      avatar: "string";
      name: "string";
    };
    sellerAddress: "string";
    takePsbt: "string";
    utxoId: "string";
    info: {
      contentTypeDetect: string;
      popLv: number;
      pinPath: string;
      genesisHeight: number;
    };
    textContent: string;
  };

  type MintMRC20PreReq = {
    mintPins: {
      address: string;
      pinId: string;
      pinUtxoOutValue: number;
      pinUtxoIndex: number;
      pinUtxoTxId: string;
      pkScript: string;
    }[];
    networkFeeRate: number;
    outAddress: string;
    outValue: number;
    tickerId: string;
  };

  type TransferMRC20PreReq = {
    changeAddress: string;
    changeOutValue: number;
    mrc20Outs: {
      address: string;
      amount: string;
      outValue: number;
      pkScript: string;
    }[];
    networkFeeRate: number;
    tickerId: string;
    transfers: {
      address: string;
      amount: string;
      pkScript: string;
      tickerId: string;
      utxoIndex: number;
      utxoOutValue: number;
      utxoTxId: string;
    }[];
  };

  type TransferMRC20PreRes = {
    extra: string;
    orderId: string;
    revealAddress: string;
    revealFee: number;
    revealGas: number;
    revealInputIndex: number;
    revealPrePsbtRaw: string;
    serviceAddress: string;
    serviceFee: number;
    totalFee: number;
    revealOutValue: number;
  };

  type MintMRC20PreRes = {
    orderId: string;
    revealAddress: string;
    revealFee: number;
    revealGas: number;
    revealInputIndex: number;
    revealPrePsbtRaw: string;
    serviceAddress: string;
    serviceFee: number;
    totalFee: number;
    revealOutValue: number;
  };
  type MRC20TickInfo = {
    amtPerMint: string;
    blockHeight: string;
    decimals: string;
    metaData: string;
    mintCount: string;
    mrc20Id: string;
    pinNumber: number;
    pinCheck: {
      count: string;
      lvl: string;
    };
    tick: string;
    tokenName: string;
    totalMinted: number;
    type: string;
    mintable: boolean;
    deployerMetaId: string;
    deployerAddress: string;
    deployerUserInfo?: {
      avatar: string;
      name: string;
    };
    deployTime: number;
    holders: number;
    txCount: number;
    price: string;
    priceUsd: string;
    floorPrice: string;
    floorPriceUsd: string;
    change24h: string;
    marketCap: string;
    marketCapUsd: string;
    totalVolume: number;
    totalSupply: string;
    supply: string;
    remaining: string;
    tag: string;
  };
  type MRC20Shovel = {
    address: string;
    chainName: string;
    content: string;
    contentBody: string;
    contentLength: number;
    contentSummary: string;
    contentType: string;
    contentTypeDetect: string;
    creator: string;
    dataValue: number;
    encryption: string;
    genesisFee: number;
    genesisHeight: number;
    genesisTransaction: string;
    id: string;
    initialOwner: string;
    isTransfered: boolean;
    location: string;
    metaid: string;
    mrc20MintPin: string;
    mrc20Minted: boolean;
    number: number;
    offset: number;
    operation: string;
    originalId: string;
    originalPath: string;
    output: string;
    outputValue: number;
    parentPath: string;
    path: string;
    pop: string;
    popLv: number;
    preview: string;
    status: number;
    timestamp: number;
    txInIndex: number;
    txIndex: number;
    version: string;
  };

  type Mrc20AddressUtxo = {
    address: string;
    blockHeight: number;
    chain: string;
    mrc20s: {
      amount: string;
      decimals: string;
      mrc20Id: string;
      tick: string;
      txPoint: string;
    }[];
    outputIndex: number;
    satoshi: number;
    satoshis: number;
    scriptPk: string;
    timestamp: number;
    txId: string;
    vout: number;
    tag: string;
    orderId: string;
  };

  type MRC20Info = {
    premineCount: string;
    mintCount: string;
    amtPerMint: string;
    blockHeight: string;
    change24h: string;
    decimals: string;
    deployTime: number;
    deployerAddress: string;
    deployerMetaId: string;
    deployerUserInfo: {
      avatar: string;
      name: string;
    };
    holders: number;
    marketCap: string;
    metaData: string;
    mintCount: string;
    mintable: boolean;
    mrc20Id: string;
    pinNumber: number;
    price: string;
    priceUsd: string;
    floorPrice: string;
    floorPriceUsd: string;
    pinCheck: {
      count: string;
      lvl: string;
      path: string;
    };
    remaining: string;
    supply: string;
    tick: string;
    tokenName: string;
    totalMinted: number;
    totalSupply: string;
    txCount: number;
    type: string;
    tag: "id-coins" | "";
  };

  type UserMrc20Asset = {
    balance: string;
    decimals: string;
    mrc20Id: string;
    tick: string;
    tokenName: string;
    avlBalance?: string;
    listedBalance?: string;
    unconfirmedBalance?: string;
    tag?: string;
    mrc20s?: {
      amount: string;
      decimals: string;
      mrc20Id: string;
      tick: string;
      txPoint: string;
    }[];
    tickInfo?: MRC20TickInfo;
  };
  type Mrc20Order = {
    orderId: string;
    utxoId: string;
    outValue: number;
    assetType: string;
    orderState: number;
    sellerAddress: string;
    seller: {
      name: string;
      avatar: string;
    };
    buyerAddress: string;
    buyer: null;
    tickId: string;
    tick: string;
    tokenName: string;
    decimals: number;
    chain: string;
    amount: number;
    amountStr: string;
    tokenPriceRate: number;
    tokenPriceRateStr: string;
    priceAmount: number;
    priceDecimal: number;
    priceCoin: string;
    fee: number;
    feeRate: number;
    takePsbt: string;
    blockHeight: number;
    confirmationState: number;
    dealTime: number;
    txId: string;
    metaData?: string;
  };

  type BuyOrderPsbtRes = {
    orderId: string;
    utxoId: string;
    outValue: number;
    assetType: string;
    orderState: number;
    sellerAddress: string;
    seller: null;
    buyerAddress: string;
    buyer: null;
    tickId: string;
    tick: string;
    tokenName: string;
    decimals: number;
    chain: string;
    amount: number;
    amountStr: string;
    tokenPriceRate: number;
    tokenPriceRateStr: string;
    priceAmount: number;
    priceDecimal: number;
    priceCoin: string;
    fee: number;
    feeRate: number;
    takePsbt: string;
    blockHeight: number;
    confirmationState: number;
    dealTime: number;
    txId: string;
  };
  type Mrc20InscribeOrder = {
    amtPerMint: string;
    blockHeight: number;
    confirmationState: number;
    decimals: string;
    mintCount: string;
    opOrderType: string;
    orderId: string;
    premineCount: string;
    pinCheck: Record<string, string>;
    startBlockHeight: string;
    tick: string;
    tickId: string;
    tickName: string;
    timestamp: number;
    totalMinted: string;
    txId: string;
    usedPins: string[];
  };
  type DeployIdCoinPreReq = {
    networkFeeRate: number;
    tick: string;
    tokenName: string;
    description: string;
    issuerMetaId: string;
    issuerAddress: string;
    issuerSign: string; //issuerSign: 对tick签名
    message: string;
    followersNum: number;
    amountPerMint: number;
    liquidityPerMint: number;
  };
  type DeployMRC20PreReq = {
    address: string;
    networkFeeRate: number;
    payload: string;
  };

  type DeployIdCoinPreRes = {
    orderId: string;
    totalFee: number;
    minerFee: number;
    receiveAddress: string;
    serviceFee: number;
  };

  type DeployMRC20PreRes = {
    extra: string;
    orderId: string;
    totalFee: number;
    minerFee: number;
    revealAddress: string;
    serviceFee: number;
  };

  type MintIdCoinPreRes = {
    orderId: string;
    totalFee: number;
    revealInscribeFee: number;
    revealMintFee: number;
    revealInscribeAddress: string;
    revealMintAddress: string;
    serviceFee: number;
    serviceAddress: string;
    revealInscribeOutValue: number;
    revealMintOutValue: number;
    revealInscribeGas: number;
    revealMintGas: number;
  };

  type IdCoin = {
    tick: string;
    tokenName: string;
    decimals: "8";
    amtPerMint: "21000000";
    followersLimit: "1000";
    mintCount: "1000";
    liquidityPerMint: 1200;
    premineCount: string;
    totalMinted: "0";
    blockHeight: string;
    metaData: string;
    type: "b4b2e279f0322924076204b325369dbe207121d3b342446b81c216490ded6ae0i0";
    qual: {
      count: "1";
      creator: string;
      lvl: string;
      path: string;
    };
    pinCheck: {
      count: "1";
      creator: string;
      lvl: string;
      path: string;
    };
    payCheck: {
      payAmount: "1200";
      payTo: string;
    };
    mrc20Id: "b4b2e279f0322924076204b325369dbe207121d3b342446b81c216490ded6ae0i0";
    pinNumber: 1238;
    holders: 0;
    deployerMetaId: string;
    deployerAddress: string;
    deployerUserInfo: {
      name: string;
      avatar: string;
    };
    deployTime: number;
    price: "0.00";
    priceUsd: string;
    pool: 0;
    totalSupply: "21000000000";
    supply: string;
    mintable: true;
    remaining: "21000000000";
    isFollowing?: boolean;
  };
  type Holder = {
    tickId: string;
    tick: string;
    tokenName: string;
    metaId: string;
    address: string;
    userInfo: {
      name: string;
      avatar: string;
    };
    balance: string;
    proportion: string;
  };

  type RefundIdCoinPreRes = {
    orderId: string;
    refundAmount: number;
    refundAddress: string;
    psbtRaw: string;
  };

  export type RedeemIdCoinPreRes = {
    minerFee: number;
    orderId: string;
    priceAmount: number;
    psbtRaw: string;
    receiveAddress: string;
    revealInputIndex: number;
    serviceFee: number;
    totalAmount: number;
    totalFee: number;
  };
  type MetaNameInfo = {
    space: "metaid";
    name: string;
    fullName: string;
    metadata: string;
    rev: string;
    relay: string;
    pinId: string;
    opAddress: string;
    opMetaId: string;
    mongoId: string;
  };
  type HotItem = {
    tickId: string;
    tick: string;
    tokenName: string;
    marketCap: number;
    lastPrice: number;
    change24H: string;
    tradeCount: number;
    holders: number;
    metaData?: string;
    tag: "id-coins" | "";
  };
}
