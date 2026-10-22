import { initEccLib, address as addressLib, Psbt } from "bitcoinjs-lib";
import * as ecc from "@bitcoin-js/tiny-secp256k1-asmjs";
import { determineAddressInfo } from "./utlis";
import { buildTx, createPsbtInput, getNetworks, getUtxos, updateInputKey } from "./psbtBuild";
import Decimal from "decimal.js";
import { SIGHASH_ALL } from "./orders";
const DUST_SIZE = 546;
type BaseBuildParams = {
  addressType: string;
  address: string;
  publicKey: Buffer;
  script: Buffer;
  network: API.Network;
};

type BuildDeployIdCoinPsbtParams = BaseBuildParams & API.DeployIdCoinPreRes;

const _buildDeployIdCoinPsbt = async (
  params: BuildDeployIdCoinPsbtParams,
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
    receiveAddress,
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
    address: receiveAddress,
    value: minerFee,
  });
  // if (serviceFee > 0) {
  //   psbt.addOutput({
  //     address: receiveAddress,
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
export const buildDeployIdCointPsbt = async (
  order: API.DeployIdCoinPreRes,
  feeRate: number,
  address: string,
  network: API.Network,
  extract: boolean = true,
  signPsbt: boolean = true
) => {
  initEccLib(ecc);
  const { minerFee } = order;
  const utxos = await getUtxos(address, network);
  console.log(utxos, "utxos in buildTicketPsbt");
  const addressType = determineAddressInfo(address).toUpperCase();
  const publicKey = await window.metaidwallet.btc.getPublicKey();
  const script = addressLib.toOutputScript(address, getNetworks(network));

  const ret = await buildTx<BuildDeployIdCoinPsbtParams>(
    utxos,
    new Decimal(minerFee),
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
    _buildDeployIdCoinPsbt,
    extract,
    signPsbt
  );
  return ret;
};
type BuildMintIdCoinPsbtParams = BaseBuildParams & API.MintIdCoinPreRes;

const _buildMintIdCoinPsbt = async (
  params: BuildMintIdCoinPsbtParams,
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
    revealMintAddress,
    revealMintFee,
    revealInscribeAddress,
    revealInscribeFee,
    network,
    serviceFee,
    serviceAddress,
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
  //   debugger;
  psbt.addOutput({
    address: revealInscribeAddress,
    value: revealInscribeFee,
  });
  psbt.addOutput({
    address: revealMintAddress,
    value: revealMintFee,
  });
  // if (serviceFee > 0) {
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
export const buildMintIdCointPsbt = async (
  order: API.MintIdCoinPreRes,
  feeRate: number,
  address: string,
  network: API.Network,
  extract: boolean = true,
  signPsbt: boolean = true
) => {
  initEccLib(ecc);
  console.log(feeRate,'feeRate in buildMintIdCointPsbt');
  const { revealInscribeFee,revealMintFee} = order;
  const utxos = await getUtxos(address, network);
  console.log(utxos, "utxos in buildMintIdCointPsbt");
  const addressType = determineAddressInfo(address).toUpperCase();
  const publicKey = await window.metaidwallet.btc.getPublicKey();
  const script = addressLib.toOutputScript(address, getNetworks(network));

  const ret = await buildTx<BuildMintIdCoinPsbtParams>(
    utxos,
    new Decimal(revealInscribeFee).add(revealMintFee),
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
    _buildMintIdCoinPsbt,
    extract,
    signPsbt
  );
  return ret;
};
type BuildRefundIdCoinPsbtParams = BaseBuildParams & API.RefundIdCoinPreRes;
const _buildRefundIdCoinPsbt = async (
  params: BuildRefundIdCoinPsbtParams,
  selectedUTXOs: API.UTXO[],
  change: Decimal,
  needChange: boolean,
  signPsbt: boolean = false
) => {
  const { addressType, address, publicKey, script, psbtRaw, network } = params;
  const psbt = Psbt.fromHex(psbtRaw, {
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
  if (!signPsbt) return psbt;
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

export const buildRefundIdCoinPsbt = async (
  order: API.RefundIdCoinPreRes,
  feeRate: number,
  address: string,
  network: API.Network
) => {
  initEccLib(ecc);
  const utxos = await getUtxos(address, network);
  console.log(utxos, "utxos in buildRefundIdCoinPsbt");
  const addressType = determineAddressInfo(address).toUpperCase();
  const publicKey = await window.metaidwallet.btc.getPublicKey();
  const script = addressLib.toOutputScript(address, getNetworks(network));

  const ret = await buildTx<BuildRefundIdCoinPsbtParams>(
    utxos,
    new Decimal(0),
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
    _buildRefundIdCoinPsbt,
    false,
    true
  );
  return ret;
};


type BuildRedeemIdCoinPsbtParams = BaseBuildParams & API.RedeemIdCoinPreRes

const _buildRedeemIdCoinCommitPsbt = async (
  params: BuildRedeemIdCoinPsbtParams,
  selectedUTXOs: API.UTXO[],
  change: Decimal,
  needChange: boolean,
  signPsbt: boolean=false,
) => {
  const {
    network,
    addressType,
    publicKey,
    script,
    receiveAddress,
    totalAmount,
    address,
  } = params
  const psbt = new Psbt({ network: getNetworks(network) })
  for (const utxo of selectedUTXOs) {
    const psbtInput = await createPsbtInput({
      utxo,
      addressType,
      publicKey,
      script,
      network,
    })
    psbtInput.sighashType = SIGHASH_ALL
    psbt.addInput(psbtInput)
  }
  psbt.addOutput({
    address: receiveAddress,
    value: totalAmount,
  })
  if (needChange || change.gt(DUST_SIZE)) {
    psbt.addOutput({
      address: address,
      value: change.toNumber(),
    })
  }
  if (!signPsbt) return psbt
  const _signed = await window.metaidwallet.btc.signPsbt({
    psbtHex: psbt.toHex(),
    options: {
      autoFinalized: true,
    },
  })
  if (typeof _signed === 'object') {
    if (_signed.status === 'canceled') throw new Error('canceled')
    throw new Error('')
  }
  const signed = Psbt.fromHex(_signed)
  return signed
}

export const buildRedeemPsbt = async (
  order: API.RedeemIdCoinPreRes,
  network: API.Network,
  address: string,
  feeRate: number,
) => {
  initEccLib(ecc)
  const { totalAmount, revealInputIndex, psbtRaw } = order
  const utxos = (await getUtxos(address, network)).sort(
    (a, b) => b.satoshi - a.satoshi,
  )
  const addressType = determineAddressInfo(address).toUpperCase()
  const publicKey = await window.metaidwallet.btc.getPublicKey()
  const script = addressLib.toOutputScript(address, getNetworks(network))
  const commitTx = await buildTx<BuildRedeemIdCoinPsbtParams>(
    utxos,
    new Decimal(totalAmount),
    feeRate,
    {
      addressType,
      address,
      publicKey: Buffer.from(publicKey, 'hex'),
      script,
      network,
      ...order,
    },
    address,
    _buildRedeemIdCoinCommitPsbt,
    true,
    true,
  )
  const { rawTx: commitTxRaw, txId } = commitTx
  const psbt = Psbt.fromHex(psbtRaw, {
    network: getNetworks(network),
  })
  // @ts-ignore
  psbt.data.globalMap.unsignedTx.tx.ins[revealInputIndex].hash = Buffer.from(
    txId,
    'hex',
  ).reverse()
  // @ts-ignore
  psbt.data.globalMap.unsignedTx.tx.ins[revealInputIndex].index = 0

  const toSignInputs = []
  for (let i = 0; i < revealInputIndex; i++) {
    psbt.updateInput(
      i,
      await updateInputKey({
        publicKey: Buffer.from(publicKey, 'hex'),
        addressType,
        network,
      }),
    )
    toSignInputs.push({
      index: i,
      address: address,
      sighashTypes: [SIGHASH_ALL],
    })
  }
  const revealPrePsbtRaw = await window.metaidwallet.btc.signPsbt({
    psbtHex: psbt.toHex(),
    options: {
      toSignInputs,
      autoFinalized: false,
    },
  })

  if (typeof revealPrePsbtRaw === 'object') {
    throw new Error('canceled')
  }
  return { commitTxRaw, revealPrePsbtRaw }
}
