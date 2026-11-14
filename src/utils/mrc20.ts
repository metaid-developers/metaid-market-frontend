import {
  networks,
  Psbt,
  address as addressLib,
  initEccLib,
  Transaction,
  payments,
} from "bitcoinjs-lib";
import {
  buildTx,
  calcFee,
  createPsbtInput,
  fillInternalKey,
  getNetworks,
  getUtxos,
} from "./psbtBuild";
import Decimal from "decimal.js";
import mempoolJS from "@mempool/mempool.js";
import * as ecc from "@bitcoin-js/tiny-secp256k1-asmjs";
import { determineAddressInfo } from "./utlis";
import {
  SIGHASH_ALL,
  SIGHASH_ALL_ANYONECANPAY,
  SIGHASH_SINGLE_ANYONECANPAY,
  toXOnly,
} from "./orders";
import { getMrc20OrderPsbt, getRawTx } from "@/services/api";
const DUST_SIZE = 546;
type PsbtInput = (typeof Psbt.prototype.data.inputs)[0];
type PsbtInputExtended = PsbtInput & { hash: string; index: number };

export function fillInternalKey2<T extends PsbtInput | PsbtInputExtended>(
  input: T,
  address: string,
  pubKey: string
): T {
  // check if the input is mine, and address is Taproot
  // if so, fill in the internal key

  const isP2TR = address.startsWith("bc1p") || address.startsWith("tb1p");
  const lostInternalPubkey = !input.tapInternalKey;

  if (isP2TR && lostInternalPubkey) {
    const tapInternalKey = toXOnly(Buffer.from(pubKey, "hex"));
    const { output } = payments.p2tr({
      internalPubkey: tapInternalKey,
    });
    if (input.witnessUtxo?.script.toString("hex") == output!.toString("hex")) {
      input.tapInternalKey = tapInternalKey;
    }
  }

  return input;
}

type CommitPsbtParams = {
  addressType: string;
  address: string;
  publicKey: Buffer;
  script: Buffer;
  network: API.Network;
} & API.MintMRC20PreRes;

const _commitMint = async (
  params: CommitPsbtParams,
  selectedUTXOs: API.UTXO[],
  change: Decimal,
  needChange: boolean,
  buildPsbt: boolean = true
) => {
  const {
    address,
    network,
    revealAddress,
    revealFee,
    addressType,
    publicKey,
    script,
    serviceFee,
    serviceAddress,
  } = params;
  const btcNetwork =
    network === "mainnet" ? networks.bitcoin : networks.testnet;
  const psbt = new Psbt({ network: btcNetwork });
  for (const utxo of selectedUTXOs) {
    const psbtInput = await createPsbtInput({
      utxo: utxo,
      addressType,
      publicKey,
      script,
      network,
    });
    psbt.addInput(psbtInput);
  }
  psbt.addOutput({
    address: revealAddress,
    value: revealFee,
  });
  // if (serviceFee > 0 && serviceAddress) {
  //   psbt.addOutput({
  //     address: serviceAddress,
  //     value: serviceFee,
  //   });
  // }
  if (needChange || change.gt(DUST_SIZE)) {
    psbt.addOutput({
      address: address,
      value: change.toNumber(),
    });
  }
  if (!buildPsbt) {
    return psbt;
  }
  const _signPsbt = await window.metaidwallet.btc.signPsbt({
    psbtHex: psbt.toHex(),
    options: {
      autoFinalized: true,
    },
  });
  if (typeof _signPsbt === "object") {
    if (_signPsbt.status === "canceled") throw new Error("canceled");
    throw new Error("");
  }
  const signPsbt = Psbt.fromHex(_signPsbt);
  return signPsbt;
};
export const commitMintMRC20PSBT = async (
  order: API.MintMRC20PreRes,
  feeRate: number,
  address: string,
  network: API.Network,
  extract: boolean = true,
  signPsbt: boolean = true
) => {
  initEccLib(ecc);
  const { revealFee, revealInputIndex } = order;
  const utxos = (await getUtxos(address, network)).sort(
    (a, b) => b.satoshi - a.satoshi
  );
  const addressType = determineAddressInfo(address).toUpperCase();
  const publicKey = await window.metaidwallet.btc.getPublicKey();
  const btcNetwork =
    network === "mainnet" ? networks.bitcoin : networks.testnet;
  const script = addressLib.toOutputScript(address, btcNetwork);
  const commitTx = await buildTx<CommitPsbtParams>(
    utxos,
    new Decimal(revealFee),
    feeRate,
    {
      addressType,
      address,
      publicKey: Buffer.from(publicKey, "hex"),
      script,
      network,
      ...order,
    },
    address,
    _commitMint,
    extract,
    signPsbt
  );
  const { rawTx, txId, psbt: commitPsbt } = commitTx;
  const psbt = Psbt.fromHex(order.revealPrePsbtRaw, {
    network: btcNetwork,
  });

  const unsignedTx = (psbt.data.globalMap.unsignedTx as any).tx;
  unsignedTx.ins[revealInputIndex].hash = Buffer.from(txId, "hex").reverse();
  unsignedTx.ins[revealInputIndex].index = 0;
  const toSignInputs = [];
  for (let i = 0; i < revealInputIndex; i++) {
    psbt.updateInput(
      i,
      await fillInternalKey({
        publicKey: Buffer.from(publicKey, "hex"),
        addressType,
        network,
      })
    );
    toSignInputs.push({
      index: i,
      address: address,
      sighashTypes: [SIGHASH_ALL],
    });
  }
  const estimatedFee = calcFee(psbt, feeRate, addressType === "P2TR");
  if (!signPsbt) {
    return {
      rawTx,
      revealPrePsbtRaw: psbt.toHex(),
      revealFee: estimatedFee.toString(),
      commitFee: commitTx.fee,
    };
  }
  const revealPrePsbtRaw = await window.metaidwallet.btc.signPsbt({
    psbtHex: psbt.toHex(),
    options: {
      toSignInputs,
      autoFinalized: false,
    },
  });

  if (typeof revealPrePsbtRaw === "object") {
    throw new Error("canceled");
  }
  return {
    rawTx,
    revealPrePsbtRaw,
    revealFee: estimatedFee,
    commitFee: commitTx.fee,
  };
};

export const transferMRC20PSBT = async (
  order: API.TransferMRC20PreRes,
  feeRate: number,
  address: string,
  network: API.Network,
  extract: boolean = true,
  signPsbt: boolean = true
) => {
  return commitMintMRC20PSBT(
    order,
    feeRate,
    address,
    network,
    extract,
    signPsbt
  );
};

export const listMrc20Order = async (
  utxo: API.UTXO,
  price: number,
  network: API.Network,
  address: string
) => {
  initEccLib(ecc);
  const btcNetwork =
    network === "mainnet" ? networks.bitcoin : networks.testnet;
  const addressType = determineAddressInfo(address).toUpperCase();
  const publicKey = await window.metaidwallet.btc.getPublicKey();
  const script = addressLib.toOutputScript(address, btcNetwork);
  const {
    data: { rawTx },
  } = await getRawTx(network, { txid: utxo.txId });
  const ordinalPreTx = Transaction.fromHex(rawTx);
  const ordinalDetail = ordinalPreTx.outs[utxo.outputIndex];
  const ordinalValue = ordinalDetail.value;
  const ask = new Psbt({ network: btcNetwork });
  for (const output in ordinalPreTx.outs) {
    try {
      ordinalPreTx.setWitness(parseInt(output), []);
    } catch (e: any) {}
  }

  const psbtInput: any = {
    hash: utxo.txId,
    index: utxo.outputIndex,
    witnessUtxo: ordinalPreTx.outs[utxo.outputIndex],
    sighashType: SIGHASH_SINGLE_ANYONECANPAY,
  };
  const input = fillInternalKey2(psbtInput, address, publicKey);
  if (["P2PKH"].includes(addressType)) {
    delete psbtInput.witnessUtxo;
    psbtInput["nonWitnessUtxo"] = ordinalPreTx.toBuffer();

    const fakeTxid =
      "0000000000000000000000000000000000000000000000000000000000000000";
    ask.addInput({
      hash: fakeTxid,
      index: 0,
      witnessUtxo: {
        script: Buffer.from(
          "76a914000000000000000000000000000000000000000088ac",
          "hex"
        ),
        value: 0,
      },
      sighashType: SIGHASH_SINGLE_ANYONECANPAY,
    });
    ask.addInput(input);

    const fakeOutScript = Buffer.from(
      "76a914000000000000000000000000000000000000000088ac",
      "hex"
    );
    ask.addOutput({
      script: fakeOutScript,
      value: 0,
    });
  } else {
    if (["P2SH"].includes(addressType)) {
      console.log("input.tapInternalKey");
      const { redeem } = payments.p2sh({
        redeem: payments.p2wpkh({
          pubkey: Buffer.from(publicKey, "hex"),
          network: btcNetwork,
        }),
        network: btcNetwork,
      });
      if (!redeem) throw new Error("redeemScript");
      input.redeemScript = redeem.output;
    }
    ask.addInput(input);
  }
  console.log(ask, "ask");
  ask.addOutput({ address, value: price });
  const signed = await window.metaidwallet.btc.signPsbt({
    psbtHex: ask.toHex(),
    options: {
      autoFinalized: true,
    },
  });
  if (typeof signed === "object") {
    if (signed.status === "canceled") throw new Error("canceled");
    throw new Error("");
  }
  return signed;
};

type BuyMrc20Params = {
  addressType: string;
  address: string;
  publicKey: Buffer;
  script: Buffer;
  signPsbt: boolean;
  network: API.Network;
} & API.BuyOrderPsbtRes;
const _buildBuyMrc20TakePsbt = async (
  buyTicketParams: BuyMrc20Params,
  selectedUTXOs: API.UTXO[],
  change: Decimal,
  needChange: boolean,
  buildPsbt: boolean = true
) => {
  const {
    addressType,
    address,
    publicKey,
    script,
    network,
    signPsbt,
    takePsbt,
  } = buyTicketParams;
  const psbt = Psbt.fromHex(takePsbt, {
    network: getNetworks(network),
  });
  let toSignIndex = psbt.data.inputs.length;
  const toSignInputs = [];
  for (const utxo of selectedUTXOs) {
    const psbtInput = await createPsbtInput({
      utxo: utxo,
      addressType,
      publicKey,
      script,
      network,
    });
    psbtInput.sighashType = SIGHASH_ALL;
    psbt.addInput(psbtInput);
    toSignInputs.push({
      index: toSignIndex,
      address,
      sighashTypes: [SIGHASH_ALL],
    });
    toSignIndex += 1;
  }
  if (needChange || change.gt(DUST_SIZE)) {
    psbt.addOutput({
      address: address,
      value: change.toNumber(),
    });
  }
  if (!signPsbt || !buildPsbt) {
    return psbt;
  }
  const _signPsbt = await window.metaidwallet.btc.signPsbt({
    psbtHex: psbt.toHex(),
    options: {
      toSignInputs,
      autoFinalized: false,
    },
  });
  if (typeof _signPsbt === "object") {
    if (_signPsbt.status === "canceled") throw new Error("canceled");
    throw new Error("");
  }
  const signed = Psbt.fromHex(_signPsbt);
  console.log(signed);
  return signed;
};
export const buildBuyMrc20TakePsbt = async (
  order: API.BuyOrderPsbtRes,
  network: API.Network,
  feeRate: number,
  manualCalcFee: boolean = true,
  signPsbt: boolean = false
) => {
  initEccLib(ecc);
  const { fee, priceAmount } = order;
  const address = await window.metaidwallet.btc.getAddress();
  const utxos = (await getUtxos(address, network)).sort(
    (a, b) => b.satoshi - a.satoshi
  );
  const addressType = determineAddressInfo(address).toUpperCase();
  const publicKey = await window.metaidwallet.btc.getPublicKey();
  const script = addressLib.toOutputScript(address, getNetworks(network));
  const ret = await buildTx<BuyMrc20Params>(
    utxos,
    new Decimal(fee + priceAmount),
    feeRate,
    {
      addressType,
      address,
      publicKey: Buffer.from(publicKey, "hex"),
      script,
      signPsbt,
      network,
      ...order,
    },
    address,
    _buildBuyMrc20TakePsbt,
    manualCalcFee
  );
  const totalSpent =
    Number(ret.fee) + Number(order.priceAmount) + Number(fee);
  return {
    rawTx: ret.rawTx,
    psbt: ret.psbt,
    fee: ret.fee,
    totalSpent,
    txOutputs: ret.txOutputs,
  };
};
export const buyMrc20Order = async (
  order: API.BuyOrderPsbtRes,
  network: API.Network,
  feeRate: number
) => {
  const { rawTx, psbt, txOutputs } = await buildBuyMrc20TakePsbt(
    order,
    network,
    feeRate,
    false,
    true
  );
  return { rawTx, txOutputs };
};

type BaseBuildParams = {
  addressType: string;
  address: string;
  publicKey: Buffer;
  script: Buffer;
  network: API.Network;
};

type BuildDeployMRC20PsbtParams = BaseBuildParams & API.DeployMRC20PreRes;

const _buildDeployMRC20Psbt = async (
  params: BuildDeployMRC20PsbtParams,
  selectedUTXOs: API.UTXO[],
  change: Decimal,
  needChange: boolean,
  signPsbt: boolean = false
) => {
  const {
    addressType,
    address,
    publicKey,
    script,
    serviceFee,
    revealAddress,
    minerFee,
    network,
  } = params;
  const psbt = new Psbt({ network: getNetworks(network) });
  for (const utxo of selectedUTXOs) {
    const psbtInput = await createPsbtInput({
      utxo: utxo,
      addressType,
      publicKey,
      script,
      network,
    });
    psbt.addInput(psbtInput);
  }
  psbt.addOutput({
    address: revealAddress,
    value: minerFee,
  });
  // if (serviceFee > 0) {
  //   psbt.addOutput({
  //     address: revealAddress,
  //     value: serviceFee,
  //   });
  // }
  if (needChange || change.gt(DUST_SIZE)) {
    psbt.addOutput({
      address: address,
      value: change.toNumber(),
    });
  }
  if (!signPsbt) return psbt;
  const _signed = await window.metaidwallet.btc.signPsbt({
    psbtHex: psbt.toHex(),
    options: {
      autoFinalized: true,
    },
  });
  if (typeof _signed === "object") {
    if (_signed.status === "canceled") throw new Error("canceled");
    throw new Error("");
  }
  const signed = Psbt.fromHex(_signed);
  return signed;
};
export const buildDeployMRC20Psbt = async (
  order: API.DeployMRC20PreRes,
  feeRate: number,
  address: string,
  network: API.Network,
  extract: boolean = true,
  signPsbt: boolean = true
) => {
  initEccLib(ecc);
  const { totalFee } = order;
  const utxos = await getUtxos(address, network);
  console.log(utxos, "utxos in buildMrc20Psbt");
  const addressType = determineAddressInfo(address).toUpperCase();
  const publicKey = await window.metaidwallet.btc.getPublicKey();
  const script = addressLib.toOutputScript(address, getNetworks(network));

  const ret = await buildTx<BuildDeployMRC20PsbtParams>(
    utxos,
    new Decimal(totalFee),
    feeRate,
    {
      addressType,
      address,
      publicKey: Buffer.from(publicKey, "hex"),
      script,
      network,
      ...order,
    },
    address,
    _buildDeployMRC20Psbt,
    extract,
    signPsbt
  );
  return ret;
};
