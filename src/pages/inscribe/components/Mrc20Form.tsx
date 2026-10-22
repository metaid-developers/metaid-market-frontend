import { Button, Card, Checkbox, Col, Modal, Collapse, ConfigProvider, Descriptions, Form, Grid, Input, InputNumber, Popover, Radio, Row, Select, Spin, Tooltip, Typography, message, Space, Image } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
const { useBreakpoint } = Grid;
import { useModel, useMatch, history, FormattedMessage } from "umi";
import "./index.less";
import { broadcastBTCTx, broadcastTx, checkPinUtxoInfo, deployCommit, deployMRC20Pre, getIdCoinInfo, getIdCoinMintOrder, getMrc20AddressShovel, getMrc20AddressUtxo, getMrc20Info, getUserMrc20List, mintIdCoinCommit, mintIdCoinPre, mintMrc20Commit, mintMrc20Pre, transferMrc20Commit, transfertMrc20Pre } from "@/services/api";
import { SIGHASH_ALL, getPkScriprt } from "@/utils/orders";
import { buildDeployMRC20Psbt, commitMintMRC20PSBT, transferMRC20PSBT } from "@/utils/mrc20";

import { ArrowRightOutlined, CloudUploadOutlined, DownOutlined, FileTextOutlined, InfoCircleOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import SuccessModal, { DefaultSuccessProps, SuccessProps } from "@/components/SuccessModal";
import btcIcon from "@/assets/logo_btc@2x.png";
import { formatMessage, formatSat } from "@/utils/utlis";
import PopLvl from "@/components/PopLvl";
import DeployComfirm, { DeployComfirmProps, defaultDeployComfirmProps } from "./DeployComfirm";
import MRC20DetailCard from "./MRC20DetailCard";
import NumberFormat from "@/components/NumberFormat";
import MRC20Icon from "@/components/MRC20Icon";
import { addUtxoSafe, getUtxos } from "@/utils/psbtBuild";
import SelectPins from "./SelectPins";
import { buildMintIdCointPsbt } from "@/utils/idcoin";
import IdCoinCard from "./IdCoinCard";
import ComfirmMintIdCoin from "./ComfirmMintIdCoin";
import idCoin from "@/pages/mrc20/idCoin";
import Decimal from "decimal.js";
import ComfirmTransfer, { TransferComfrimParams } from "./ComfirmTransfer";
import ComfirmMintMrc20, { MintMrc20ComfrimParams } from "./ComfirmMintMrc20";
import Trans from "@/components/Trans";
import UploadImg from "./UploadImg";
const formItemLayout = {
    labelCol: {
        xs: { span: 24 },
        sm: { span: 5 },
    },
    wrapperCol: {
        xs: { span: 24 },
        sm: { span: 19 },
    },
};

export interface MRC20TransferParams {
    body: string
    mrc20TickId: string
    flag?: 'metaid' | 'testid'
    revealAddr?: string
    commitFeeRate: number
    revealFeeRate: number
    changeAddress?: string
    revealOutValue?: number
    service?: {
        address: string
        satoshis: string
    }
}
export default ({ setTab }: { setTab: (tab: string) => void }) => {
    const match = useMatch('/inscribe/:tab/:tick');
    const [activeKey, setActiveKey] = useState<string[]>([]);

    const { sm } = useBreakpoint();
    const [form] = Form.useForm();
    const type = Form.useWatch('type', form);
    const _deployMaxMintCount = Form.useWatch('deployMaxMintCount', form);
    const _deployAmountPerMint = Form.useWatch('deployAmountPerMint', form);
    const _deployIcon = Form.useWatch('deployIcon', form);
    const _deployPremineCount = Form.useWatch('deployPremineCount', form);
    const [uploadVisible, setUploadVisible] = useState(false);
    // transferTickerId
    const _transferTickerId = Form.useWatch('transferTickerId', form);
    const totalSupply = useMemo(() => {
        if (_deployMaxMintCount && _deployAmountPerMint) {
            return BigInt(Math.round(_deployMaxMintCount)) * BigInt(Math.round(_deployAmountPerMint))
        } else {
            return BigInt(0)
        }
    }, [_deployMaxMintCount, _deployAmountPerMint])
    const totalPreMint = useMemo(() => {
        if (_deployPremineCount && _deployAmountPerMint) {
            return BigInt(Math.round(_deployPremineCount)) * BigInt(Math.round(_deployAmountPerMint))
        } else {
            return BigInt(0)
        }
    }, [_deployPremineCount, _deployAmountPerMint])
    const _tab = match?.params.tab;
    const _tickerId = match?.params.tick;
    const [mintTokenID, setMintTokenID] = useState<string>('');
    const [mintInfoLoading, setMintInfoLoading] = useState(false);
    const [mintInfoStatus, setMintInfoStatus] = useState('');
    const [mintMrc20Info, setMintMrc20Info] = useState<API.MRC20TickInfo>();
    const [IdCoinInfo, setIdCoinInfo] = useState<API.IdCoin>();
    const [shovel, setShowel] = useState<API.MRC20Shovel[]>();
    const [list, setList] = useState<API.UserMrc20Asset[]>([]);
    const [refetch, setRefetch] = useState<boolean>(false)

    // mint Idcoin 
    const [comfirmVisible, setComfirmVisible] = useState(false)
    const [mintIdCoinOrder, setMintIdCoinOrder] = useState<API.MintIdCoinPreRes & { _gasFee: number, errMsg?: string }>();
    const [addressMintState, setAddressMintState] = useState<number>(0)

    // transfer mrc20
    const [transferVisible, setTransferVisible] = useState(false);
    const [transfeComfirmParams, setTransfeComfirmParams] = useState<TransferComfrimParams>();
    // mint mrc20
    const [mintVisible, setMintVisible] = useState(false);
    const [mintComfirmParams, setMintComfirmParams] = useState<MintMrc20ComfrimParams>();
    const [successProp, setSuccessProp] =
        useState<SuccessProps>(DefaultSuccessProps);
    const [deployComfirmProps, setDeployComfirmProps] = useState<DeployComfirmProps>(defaultDeployComfirmProps)
    const [submiting, setSubmiting] = useState(false);
    const [comfirming, setComfirming] = useState(false);
    const { authParams, connected, connect, feeRate, network, disConnect, btcConnector, btcAddress } =
        useModel("wallet");
    const checkWallet = async () => {
        if (!btcConnector) return false;
        const address = await window.metaidwallet.btc.getAddress();
        if (address !== btcConnector.wallet.address) {
            disConnect();
            return false;
        }
        return true;
    };

    useEffect(() => {
        if (_tab === 'MRC-20') {
            setTab('MRC-20')
            if (_tickerId) {
                setMintTokenID(_tickerId)
                form.setFieldsValue({ type: 'mint', tickerId: _tickerId })
            }
        }

    }, [_tab, _tickerId])

    const handleMintTokenIDChange = (e) => {
        setMintTokenID(e.target.value);
    };

    // precision
    const transferPrecision = useMemo(() => {
        if (_transferTickerId && list.length > 0) {
            const token = list.find(item => item.mrc20Id === _transferTickerId)
            if (token) {
                return Number(token.decimals)
            }
        }
        return 0
    }, [_transferTickerId, list])



    const fetchList = useCallback(async () => {
        if (!btcAddress) return;
        const { data } = await getUserMrc20List(network, { address: btcAddress, cursor: 0, size: 50 });
        if (data && data.list) {
            setList(data.list);
        }

    }, [btcAddress, network])
    useEffect(() => {
        fetchList()
    }, [fetchList])

    useEffect(() => {
        let didCancel = false;
        const fetchMrc20Info = async () => {
            if (!mintTokenID) return;
            setShowel([])
            setIdCoinInfo(undefined)
            setMintInfoLoading(true)
            setMintInfoStatus('validating')
            const params = {};
            if (mintTokenID.length > 24) {
                params.tickId = mintTokenID
            } else {
                params.tick = mintTokenID.toUpperCase()
            }
            const { code, message, data } = await getMrc20Info(network, params);
            let _shovels: API.MRC20Shovel[] = [];
            let _idCoin: API.IdCoin | undefined = undefined;
            let _addressMintState = 0;
            if (data && data.mrc20Id) {
                const params: any = { tickId: data.mrc20Id };
                if (btcAddress) {
                    params.address = btcAddress
                }
                const idCoinRet = await getIdCoinInfo(network, params);
                if (idCoinRet.code === 0 && idCoinRet.data) {
                    _idCoin = idCoinRet.data;
                    if (btcAddress && authParams) {
                        const mintOrder = await getIdCoinMintOrder(network, { tickId: data.mrc20Id, address: btcAddress }, { headers: { ...authParams } });
                        if (mintOrder.code === 0 && mintOrder.data && mintOrder.data.addressMintState === 1) {
                            _addressMintState = 1
                        }
                    }
                }
            }
            if (!_idCoin || _addressMintState === 1) {
                if (btcAddress && data && data.pinCheck && data.pinCheck.count) {
                    const { data: ret, code } = await getMrc20AddressShovel(network, { tickId: data.mrc20Id, address: btcAddress, cursor: 0, size: 100 });
                    if (code === 0 && ret && ret.list) {
                        const checks = await checkPinUtxoInfo(network, { outPoints: ret.list.map(item => item.output) })
                        if (checks.code === 0 && checks.data) {
                            _shovels = ret.list.filter((item, index) => {
                                return checks.data[item.output].spendStatus !== 'spend'
                            })
                        } else {
                            _shovels = ret.list
                        }

                    }
                }
            }

            if (didCancel) return;
            setMintInfoLoading(false)
            setShowel(_shovels)
            setIdCoinInfo(_idCoin)
            setAddressMintState(_addressMintState)
            if (data && data.mrc20Id) {
                setMintMrc20Info(data);
                setMintInfoStatus('success')
                _shovels.length > 0 && form.setFieldsValue({ pins: _shovels.slice(0, Number(data.pinCheck.count)).map(item => item.id) })
                return
            }

            setMintInfoStatus('error')
            setMintMrc20Info(undefined)
        }
        fetchMrc20Info()
        return () => {
            didCancel = true
        }
    }, [mintTokenID, btcAddress, network, authParams, refetch])


    const deploy = async () => {
        if (!connected || !btcAddress || !btcConnector) return;

        const pass = await checkWallet();
        if (!pass) throw new Error("Account change");
        const { deployTicker, deployTokenName, deployCreator = '', deployBeginHeight = '', deployEndHeight = '', deployIcon, deployMaxMintCount, deployAmountPerMint, deployDecimals = '8', deployPremineCount = '', deployPath = '', deployDifficultyLevel = '', deployCount = '', deployPayTo = '', deployPayAmount = '' } = form.getFieldsValue();

        const payload: any = {
            tick: deployTicker,
            tokenName: deployTokenName,
            decimals: String(deployDecimals),
            amtPerMint: String(deployAmountPerMint),
            mintCount: String(deployMaxMintCount),
            premineCount: String(deployPremineCount),
            blockheight: '',
            beginHeight: String(deployBeginHeight),
            endHeight: String(deployEndHeight),
            pinCheck: {
                creator: deployCreator,
                path: deployPath,
                count: String(deployCount),
                lvl: String(deployDifficultyLevel)
            },
            payCheck: {
                payTo: deployPayTo,
                payAmount: deployPayAmount ? new Decimal(deployPayAmount).times(1e8).toFixed(0) : ''
            }
        }
        if ((Number(payload.decimals) + (BigInt(payload.amtPerMint) * BigInt(payload.mintCount)).toString().length) > 20) {
            throw new Error('The decimals, Amount Per Mint, and Mint Limit values must not exceed 20 digits')
        }

        if (deployIcon) {
            payload.metadata = JSON.stringify({ icon: deployIcon })
        }

        const { code, message, data: order } = await deployMRC20Pre(network, { address: btcAddress, networkFeeRate: Number(feeRate), payload: JSON.stringify(payload) }, { headers: { ...authParams } });
        if (code !== 0) throw new Error(message)
        const { rawTx } = await buildDeployMRC20Psbt(order, feeRate, btcAddress, network)

        // const ret = await window.metaidwallet.btc.deployMRC20({
        //     flag: network === "mainnet" ? "metaid" : "testid",
        //     commitFeeRate: Number(feeRate),
        //     revealFeeRate: Number(feeRate),
        //     body: payload,
        //     options: {
        //         markSafe: true,
        //         noBroadcast: false
        //     }
        // }).catch(err => {
        //     throw new Error(err)
        // })
        // if (ret.status) throw new Error(ret.status)
        const commitRes = await deployCommit(network, { commitTxRaw: rawTx, commitTxOutIndex: 0, orderId: order.orderId }, {
            headers: {
                ...authParams,
            },
        })

        if (commitRes.code !== 0) throw new Error(commitRes.message)
        await addUtxoSafe(btcAddress, [{ txId: commitRes.data.commitTxId, vout: order.serviceFee ? 2 : 1 }])
        setDeployComfirmProps(defaultDeployComfirmProps)
        setSuccessProp({
            show: true,
            onClose: () => {
                setSuccessProp(DefaultSuccessProps);
                form.resetFields();
                form.setFieldValue('type', 'deploy')
            },
            onDown: () => {
                setSuccessProp(DefaultSuccessProps);
                form.resetFields();
                history.push('/mrc20History')

            },
            title: <Trans>Deploy</Trans>,
            tip: <Trans>Successful</Trans>,
            okText: <Trans>OK</Trans>,
            txs: [{
                label: 'Reveal TxId',
                txid: commitRes.data.revealTxId
            }, {
                label: 'Commit TxId',
                txid: commitRes.data.commitTxId
            }],
            children: (
                <div className="inscribeSuccess">
                    <div className="tips">
                        <InfoCircleOutlined />
                        <span><Trans>Current deployment transaction status is Pending. Please wait for the deployment transaction to be confirmed before minting this token.</Trans></span>
                    </div>
                </div>
            ),
        });
    }
    const mintIdCoin = async () => {
        if (!connected || !btcAddress || !btcConnector || !mintIdCoinOrder) return;

        const pass = await checkWallet();
        if (!IdCoinInfo) return;
        try {


            if (!pass) throw new Error("Account change");

            const { rawTx } = await buildMintIdCointPsbt(
                mintIdCoinOrder,
                feeRate,
                btcAddress,
                network
            )
            const commitRes = await mintIdCoinCommit(network, {
                orderId: mintIdCoinOrder.orderId,
                commitTxOutInscribeIndex: 0,
                commitTxOutMintIndex: 1,
                commitTxRaw: rawTx,
            }, { headers: authParams })
            console.log(commitRes)
            if (commitRes.code !== 0) throw new Error(commitRes.message)
            await addUtxoSafe(btcAddress, [{ txId: commitRes.data.commitTxId, vout: 2 }])
            setMintIdCoinOrder(undefined)
            setComfirmVisible(false)
            setSuccessProp({
                show: true,
                onClose: () => {
                    setSuccessProp(DefaultSuccessProps);
                    form.setFieldValue('type', 'mint')
                },
                onDown: () => {
                    setSuccessProp(DefaultSuccessProps);
                    form.resetFields();
                    history.push('/mrc20History?tab=ID-Coins Mint')

                },
                title: <Trans>Mint</Trans>,
                tip: <Trans>Successful</Trans>,
                okText: <Trans>OK</Trans>,
                txs: [
                    {
                        label: 'Commit TxId',
                        txid: commitRes.data.commitTxId
                    },
                    {
                        label: 'Reveal Inscribe TxId',
                        txid: commitRes.data.revealInscribeTxId
                    },
                    {
                        label: 'Reveal Mint TxId',
                        txid: commitRes.data.revealMintTxId
                    },

                ],
                children: (
                    <div className="inscribeSuccess">
                        <div className="tips">
                            <InfoCircleOutlined />
                            <span><Trans>Current minting transaction status is Pending. Please wait for the minting transaction to be confirmed before transferring or trading this token.</Trans></span>
                        </div>
                    </div>
                ),
            });
        } catch (err) {
            setMintIdCoinOrder(undefined)
            setComfirmVisible(false)

            throw err
        }
    }

    const success = (title: string, ret: any) => {
        setSuccessProp({
            show: true,
            onClose: () => {
                setSuccessProp(DefaultSuccessProps);
                form.resetFields();
            },
            onDown: () => {
                setSuccessProp(DefaultSuccessProps);
                form.resetFields();
                form.setFieldValue('type', 'transfer')

            },
            title: <Trans>{title}</Trans>,
            tip: <Trans>Successful</Trans>,
            txs: [{
                label: 'Reveal TxId',
                txid: ret.revealTxId
            }, {
                label: 'Commit TxId',
                txid: ret.commitTxId
            }],
            children: (
                <div className="inscribeSuccess">

                </div>
            ),
        });
    }

    const beforeSubmit = async () => {
        if (!connected || !btcAddress) return;
        await form.validateFields();
        const { type } = form.getFieldsValue();
        try {
            if (type === 'deploy') {
                const { deployTicker, deployTokenName, deployCreator = '', deployBeginHeight = '', deployEndHeight = '', deployPayTo = '', deployPayAmount = '', deployIcon, deployMaxMintCount, deployAmountPerMint, deployDecimals = '8', deployPremineCount = '', deployPath = '', deployDifficultyLevel = '', deployCount = '' } = form.getFieldsValue();
                const payload: any = {
                    tick: deployTicker,
                    tokenName: deployTokenName,
                    decimals: String(deployDecimals),
                    amtPerMint: String(deployAmountPerMint),
                    mintCount: String(deployMaxMintCount),
                    premineCount: String(deployPremineCount),
                    blockheight: '',
                    beginHeight: String(deployBeginHeight),
                    endHeight: String(deployEndHeight),
                    pinCheck: {
                        creator: deployCreator,
                        path: deployPath,
                        count: String(deployCount),
                        lvl: String(deployDifficultyLevel)
                    },
                    payCheck: {
                        payTo: deployPayTo,
                        payAmount: deployPayAmount ? new Decimal(deployPayAmount).times(1e8).toFixed(0) : ''
                    }
                }
                if ((Number(payload.decimals) + (BigInt(payload.amtPerMint) * BigInt(payload.mintCount)).toString().length) > 20) {
                    message.error(formatMessage('The decimals, Amount Per Mint, and Mint Limit values must not exceed 20 digits'))
                    return
                }

                if (deployIcon) {
                    payload.metadata = JSON.stringify({ icon: deployIcon })
                }

                const { code, message: msg, data: order } = await deployMRC20Pre(network, { address: btcAddress, networkFeeRate: Number(feeRate), payload: JSON.stringify(payload) }, { headers: { ...authParams } });
                if (code !== 0) throw new Error(msg)
                const { fee } = await buildDeployMRC20Psbt(order, feeRate, btcAddress, network, false, false)
                setDeployComfirmProps({
                    show: true,
                    onClose: () => {
                        setSubmiting(false)
                        setDeployComfirmProps(defaultDeployComfirmProps)
                    },
                    onConfirm: submit,
                    submiting: submiting,
                    deployInfo: payload,
                    fees: { ...order, commintGas: Number(fee) }
                })
            } else {
                if (type === 'mint') {
                    if (IdCoinInfo && addressMintState === 0) {
                        if (!connected || !btcAddress || !btcConnector) return;
                        const pass = await checkWallet();
                        if (!pass) throw new Error("Account change");
                        if (!IdCoinInfo) return;

                        const prePayload = {
                            networkFeeRate: feeRate,
                            tickId: IdCoinInfo.mrc20Id,
                            outAddress: btcAddress,
                            outValue: 546,
                        }
                        const { code, message, data } = await mintIdCoinPre(network, prePayload, { headers: { ...authParams } })
                        if (code !== 0) throw new Error(message);
                        let fee = "0";
                        let errMsg = ''
                        try {


                            const { fee: _fee } = await buildMintIdCointPsbt(
                                data,
                                feeRate,
                                btcAddress,
                                network,
                                false,
                                false
                            )
                            fee = _fee
                        } catch (e: any) {
                            errMsg = e.message
                        }
                        setMintIdCoinOrder({ ...data, _gasFee: Number(fee), errMsg })
                        setComfirmVisible(true)
                    } else {
                        await beforeMintMrc20()
                    }


                } else if (
                    type === 'transfer'
                ) {
                    await beforeTransfer();
                } else {
                    await submit()
                }

            }
        } catch (err) {
            message.error(err.message)
        }
    }
    const beforeTransfer = async () => {
        await form.validateFields();
        try {
            setComfirming(true)

            const { transferTickerId, amount, recipient } = form.getFieldsValue();
            if (!btcAddress) throw new Error('Please connect wallet')
            const _tick = list.find(item => item.mrc20Id === transferTickerId)
            if (!_tick) throw new Error('Token not found')
            const { data: utxoList } = await getMrc20AddressUtxo(network, { address: btcAddress, tickId: String(transferTickerId), cursor: 0, size: 100 }, {
                headers: {
                    ...authParams,
                },
            });
            if (utxoList.list.length === 0) throw new Error('No UTXO');
            const selectedUtxos = [];
            let totalAmount = 0;
            for (const utxo of utxoList.list) {
                if (utxo.blockHeight === -1) continue;
                for (const tick of utxo.mrc20s) {
                    if (Number(tick.amount) > 0) {
                        totalAmount += Number(tick.amount)
                        selectedUtxos.push({
                            utxoIndex: utxo.outputIndex,
                            utxoTxId: utxo.txId,
                            utxoOutValue: utxo.satoshi,
                            tickerId: transferTickerId,
                            amount: tick.amount,
                            address: utxo.address,
                            pkScript: utxo.scriptPk
                        })
                    }
                    if (totalAmount > amount) {
                        break
                    }
                }
                if (totalAmount > amount) {
                    break
                }
            }
            if (totalAmount < amount) {
                throw new Error('No available UTXOs. Please wait for existing transactions to be confirmed. ')
            }

            const params: API.TransferMRC20PreReq = {
                networkFeeRate: feeRate,
                tickerId: transferTickerId,
                changeAddress: btcAddress,
                changeOutValue: 546,
                transfers: selectedUtxos,
                mrc20Outs: [{ amount: String(amount), address: recipient, outValue: 546, pkScript: getPkScriprt(recipient, network).toString('hex') }]
            }
            const { code, message, data } = await transfertMrc20Pre(network, params, {
                headers: {
                    ...authParams,
                },
            })
            if (code !== 0) throw new Error(message);
            const bulidRet = await transferMRC20PSBT(data, feeRate, btcAddress, network, false, false);
            console.log(bulidRet, 'revealPrePsbtRaw');
            const transferOrder: TransferComfrimParams = {
                order: data,
                networkFeeRate: feeRate,
                commitGas: bulidRet.commitFee,
                recipient,
                amount,
                tick: _tick
            }
            setTransfeComfirmParams(transferOrder)
            setTransferVisible(true)

        } catch (err: any) {
            message.error(err.message)
        }
        setComfirming(false)

    }
    const transferMrc20 = async () => {
        try {
            setSubmiting(true)
            if (!btcAddress) throw new Error('Please connect wallet')
            if (!transfeComfirmParams) throw new Error('No data')
            const { order, networkFeeRate, commitGas, recipient } = transfeComfirmParams;
            const { rawTx, revealPrePsbtRaw } = await transferMRC20PSBT(order, networkFeeRate, btcAddress, network);
            console.log(revealPrePsbtRaw, 'revealPrePsbtRaw', rawTx);
            const ret = await transferMrc20Commit(network, { orderId: order.orderId, commitTxRaw: rawTx, commitTxOutIndex: 0, revealPrePsbtRaw }, { headers: { ...authParams } });
            if (ret.code !== 0) throw new Error(ret.message);
            await addUtxoSafe(btcAddress, [{ txId: ret.data.commitTxId, vout: 1 }])
            await fetchList()
            setTransfeComfirmParams(undefined)
            setTransferVisible(false)
            success('Transfer', ret.data)
        } catch (e: any) {
            message.error(e.message)

        }
        setSubmiting(false)
    }

    const beforeMintMrc20 = async () => {
        await form.validateFields();
        try {
            setComfirming(true);
            const { type, pins = [] } = form.getFieldsValue();
            if (!mintMrc20Info) throw new Error('Token not found');
            if (!btcAddress) throw new Error('Please connect wallet')

            if (Number(mintMrc20Info.pinCheck.count) && pins.length < Number(mintMrc20Info.pinCheck.count)) {
                throw new Error(`Select  ${mintMrc20Info.pinCheck.count} PINs`)
            }
            const mintPins = pins.map((pinId: string) => {
                const pin = shovel?.find(item => item.id === pinId);
                if (!pin) return;
                return {
                    pinId: pin.id,
                    pinUtxoTxId: pin.location.split(":")[0],
                    pinUtxoIndex: Number(pin.location.split(":")[1]),
                    pinUtxoOutValue: pin.outputValue,
                    address: btcAddress,
                    pkScript: getPkScriprt(btcAddress, network).toString('hex'),
                }
            })

            const { code, message, data, } = await mintMrc20Pre(network, {
                mintPins: mintPins, networkFeeRate: feeRate, outAddress: btcAddress, outValue: 546, tickerId: mintMrc20Info.mrc20Id,
            }, {
                headers: {
                    ...authParams,
                },
            });
            if (code !== 0) throw new Error(message);

            const buildRet = await commitMintMRC20PSBT(data, feeRate, btcAddress, network, false, false);
            const mintMrc20Params: MintMrc20ComfrimParams = {
                order: data,
                commitGas: buildRet.commitFee,
                mrc20: mintMrc20Info,
            }
            setMintComfirmParams(mintMrc20Params)
            setMintVisible(true)

        } catch (e: any) {
            console.error(e);
            message.error(e.message)
        }
        setComfirming(false)
    }

    const mintMrc20 = async () => {
        try {
            setSubmiting(true)
            if (!btcAddress) throw new Error('Please connect wallet')
            if (!mintComfirmParams) throw new Error('No data')
            const { order, commitGas, mrc20 } = mintComfirmParams;
            const { rawTx, revealPrePsbtRaw } = await commitMintMRC20PSBT(order, feeRate, btcAddress, network);
            const ret = await mintMrc20Commit(network, { orderId: order.orderId, commitTxRaw: rawTx, commitTxOutIndex: 0, revealPrePsbtRaw }, { headers: { ...authParams } })
            if (ret.code !== 0) throw new Error(ret.message);
            await addUtxoSafe(btcAddress, [{ txId: ret.data.commitTxId, vout: 1 }])
            setRefetch(!refetch)
            setSuccessProp({
                show: true,
                onClose: () => {
                    setSuccessProp(DefaultSuccessProps);
                    // form.resetFields();
                    // form.setFieldValue('type', 'mint')
                },
                onDown: () => {
                    setSuccessProp(DefaultSuccessProps);
                    form.resetFields();
                    history.push('/mrc20History?tab=Mint')

                },
                title: <Trans>Mint</Trans>,
                tip: <Trans>Successful</Trans>,
                okText: <Trans>OK</Trans>,
                txs: [
                    {
                        label: 'Reveal TxId',
                        txid: ret.data.revealTxId
                    },
                    {
                        label: 'Commit TxId',
                        txid: ret.data.commitTxId
                    }
                ],
                children: (
                    <div className="inscribeSuccess">
                        <div className="tips">
                            <InfoCircleOutlined />
                            <span><Trans>Current minting transaction status is Pending. Please wait for the minting transaction to be confirmed before transferring or trading this token.</Trans></span>
                        </div>
                    </div>
                ),
            });
            setComfirmVisible(false)
            setMintComfirmParams(undefined)

        } catch (e: any) {
            if (e.message === 'Insufficient funds to reach the target amount') {
                message.error(formatMessage('No available UTXOs. Please wait for existing transactions to be confirmed.'));

            } else {
                message.error(e.message)
            }

        }
        setSubmiting(false)
    }

    const submit = async () => {
        if (!connected || !btcAddress) return;
        await form.validateFields();
        setSubmiting(true);
        const { type, pins = [], transferTickerId, amount, recipient } = form.getFieldsValue();
        try {

            if (type === 'deploy') {
                await deploy();

            }
            if (type === 'mint') {
                if (IdCoinInfo && addressMintState === 0) {
                    await mintIdCoin()

                } else {
                    if (!mintMrc20Info) return;
                    if (Number(mintMrc20Info.pinCheck.count) && pins.length < Number(mintMrc20Info.pinCheck.count)) {
                        throw new Error(`Select  ${mintMrc20Info.pinCheck.count} PINs`)
                    }
                    const mintPins = pins.map((pinId: string) => {
                        const pin = shovel?.find(item => item.id === pinId);
                        if (!pin) return;
                        return {
                            pinId: pin.id,
                            pinUtxoTxId: pin.location.split(":")[0],
                            pinUtxoIndex: Number(pin.location.split(":")[1]),
                            pinUtxoOutValue: pin.outputValue,
                            address: btcAddress,
                            pkScript: getPkScriprt(btcAddress, network).toString('hex'),
                        }
                    })

                    const { code, message, data, } = await mintMrc20Pre(network, {
                        mintPins: mintPins, networkFeeRate: feeRate, outAddress: btcAddress, outValue: 546, tickerId: mintMrc20Info.mrc20Id,
                    }, {
                        headers: {
                            ...authParams,
                        },
                    });
                    if (code !== 0) throw new Error(message);

                    const { rawTx, revealPrePsbtRaw } = await commitMintMRC20PSBT(data, feeRate, btcAddress, network);
                    const ret = await mintMrc20Commit(network, { orderId: data.orderId, commitTxRaw: rawTx, commitTxOutIndex: 0, revealPrePsbtRaw }, { headers: { ...authParams } })
                    if (ret.code !== 0) throw new Error(ret.message);
                    await addUtxoSafe(btcAddress, [{ txId: ret.data.commitTxId, vout: 1 }])
                    setRefetch(!refetch)
                    setSuccessProp({
                        show: true,
                        onClose: () => {
                            setSuccessProp(DefaultSuccessProps);
                            // form.resetFields();
                            // form.setFieldValue('type', 'mint')
                        },
                        onDown: () => {
                            setSuccessProp(DefaultSuccessProps);
                            form.resetFields();
                            history.push('/mrc20History?tab=Mint')

                        },
                        title: <Trans>Mint</Trans>,
                        tip: <Trans>Successful</Trans>,
                        okText: <Trans>SucceOKssful</Trans>,
                        txs: [
                            {
                                label: 'Reveal TxId',
                                txid: ret.data.revealTxId
                            },
                            {
                                label: 'Commit TxId',
                                txid: ret.data.commitTxId
                            }
                        ],
                        children: (
                            <div className="inscribeSuccess">
                                <div className="tips">
                                    <InfoCircleOutlined />
                                    <span><Trans>Current minting transaction status is Pending. Please wait for the minting transaction to be confirmed before transferring or trading this token.</Trans></span>
                                </div>
                            </div>
                        ),
                    });
                }

            }
            if (type === 'transfer') {
                const { data: utxoList } = await getMrc20AddressUtxo(network, { address: btcAddress, tickId: String(transferTickerId), cursor: 0, size: 100 }, {
                    headers: {
                        ...authParams,
                    },
                });
                if (utxoList.list.length === 0) throw new Error('No UTXO');
                const selectedUtxos = [];
                let totalAmount = 0;
                console.log(utxoList, 'getMrc20AddressUtxo')
                for (const utxo of utxoList.list) {
                    for (const tick of utxo.mrc20s) {
                        if (Number(tick.amount) > 0) {
                            totalAmount += Number(tick.amount)
                            selectedUtxos.push({
                                utxoIndex: utxo.outputIndex,
                                utxoTxId: utxo.txId,
                                utxoOutValue: utxo.satoshi,
                                tickerId: transferTickerId,
                                amount: tick.amount,
                                address: utxo.address,
                                pkScript: utxo.scriptPk
                            })
                        }
                        if (totalAmount > amount) {
                            break
                        }
                    }
                    if (totalAmount > amount) {
                        break
                    }
                }
                if (totalAmount < amount) {
                    throw new Error(formatMessage('No available UTXOs. Please wait for existing transactions to be confirmed.'))
                }

                const params: API.TransferMRC20PreReq = {
                    networkFeeRate: feeRate,
                    tickerId: transferTickerId,
                    changeAddress: btcAddress,
                    changeOutValue: 546,
                    transfers: selectedUtxos,
                    mrc20Outs: [{ amount: String(amount), address: recipient, outValue: 546, pkScript: getPkScriprt(recipient, network).toString('hex') }]
                }

                const { code, message, data } = await transfertMrc20Pre(network, params, {
                    headers: {
                        ...authParams,
                    },
                })
                if (code !== 0) throw new Error(message);

                const { rawTx, revealPrePsbtRaw } = await transferMRC20PSBT(data, feeRate, btcAddress, network);

                const ret = await transferMrc20Commit(network, { orderId: data.orderId, commitTxRaw: rawTx, commitTxOutIndex: 0, revealPrePsbtRaw }, { headers: { ...authParams } });
                if (ret.code !== 0) throw new Error(ret.message);
                await addUtxoSafe(btcAddress, [{ txId: ret.data.commitTxId, vout: 1 }])
                await fetchList()
                success('Transfer', ret.data)
            }
        } catch (e: any) {
            console.error(e);
            message.error(e.message)


        }
        setSubmiting(false);


    }
    // const [validateTickerStatus,setValidateTickerStatus] = useState<string>()
    // const validateTicker = async (tick: string) => {
    //     setValidateTickerStatus('validating')
    //     const { data } = await getMrc20Info(network, { tick: tick });
    //     if(data && data.mrc20Id){
    //         setValidateTickerStatus('error')
    //     } 
    // }
    const submitBtnText = useMemo(() => {
        if (type === 'deploy') {
            return 'Deploy'
        }
        if (type === 'transfer') {
            return 'Transfer'
        }
        if (type === 'mint') {
            if (IdCoinInfo) {
                if (!IdCoinInfo.isFollowing) {
                    return 'Follow And Mint'
                }
            }
            if (mintMrc20Info) {
                if (mintMrc20Info.mintable === false) {
                    return 'Non-mintable'
                }
            }
            return 'Mint'
        }
        { type === 'deploy' ? 'Deploy' : type === 'mint' ? (mintMrc20Info && mintMrc20Info.mintable === false) ? 'Non-mintable' : 'Mint' : 'Transfer' }
    }, [type, mintMrc20Info, IdCoinInfo])

    return <div className="mrc20Form">
        <ConfigProvider
            theme={{
                components: {
                    "Input": {

                        "colorSplit": "rgba(253, 253, 253, 0)"
                    },
                    "InputNumber": {
                        "colorSplit": "rgba(253, 253, 253, 0)"
                    }
                },
            }}>
            <Form
                {...formItemLayout}
                variant="filled"
                style={{ maxWidth: "96vw", width: 632 }}
                initialValues={{
                    type: 'deploy',
                    // transferTickerId: '8e659899275b1d06db870fbee9b293bc73d25e063cc86860a6d52c1e11091e9bi0',
                    // recipient: 'mwKUTvJF43BqGqANeVdrtpRwd2zxNFvnWQ',
                    // amount: 200
                    deployPremineCount: 0,
                    deployMaxMintCount: 21000,
                    deployDecimals: 8,
                    deployAmountPerMint: 1000,
                }}
                form={form}
            >
                <Form.Item label={<Trans>Type</Trans>} name="type" rules={[{ required: true }]}>
                    <Radio.Group className="customRadio">
                        <Radio value="deploy" className="customRadioItem"><Trans>Deploy</Trans></Radio>
                        <Radio value="mint" className="customRadioItem"><Trans>Mint</Trans></Radio>
                        <Radio value="transfer" className="customRadioItem"><Trans>Transfer</Trans></Radio>
                    </Radio.Group>
                </Form.Item>
                <Form.Item noStyle shouldUpdate={(prev, cur) => prev.type !== cur.type}>
                    {
                        ({ getFieldValue }) => {
                            const type = getFieldValue('type');
                            if (type === 'deploy') {
                                return <>
                                    <Form.Item label={<Trans>Ticker</Trans>} name="deployTicker"
                                        rules={[{ required: true }, { type: 'string', min: 2, max: 24 }, { pattern: new RegExp(/^[a-zA-Z0-9\-]*$/), message: "No Space or Special Characters Allowed" }, () => ({
                                            async validator(_, value) {
                                                if (!value || value.length < 2) {
                                                    return Promise.resolve();
                                                }

                                                const { data } = await getMrc20Info(network, { tick: value.toUpperCase() });
                                                if (data && data.mrc20Id) {
                                                    return Promise.reject(new Error(formatMessage('This tick already exists.')));
                                                }

                                            },
                                        })]}
                                        validateTrigger="onBlur"
                                    >
                                        <Input
                                            size="large"
                                            maxLength={24}
                                            placeholder={formatMessage('2-24 characters')}
                                        />
                                    </Form.Item>




                                    <Form.Item rules={[{ required: true }, { max: 1000000000000, min: 1, type: 'number', message: formatMessage('Total number of minting transactions allowed. Min: 1, Max: 1,000,000,000,000 （1e12).') }]} label={formatMessage('Mint Limit')} name="deployMaxMintCount"

                                    >
                                        <InputNumber
                                            size="large"
                                            style={{ width: '100%' }}
                                            // min={1}

                                            precision={0}
                                            addonAfter={
                                                <Tooltip title={<Trans>Total number of minting transactions allowed. Min: 1, Max: 1,000,000,000,000 （1e12).</Trans>}>
                                                    <QuestionCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                                                </Tooltip>}
                                        />
                                    </Form.Item>
                                    <Form.Item rules={[{ required: true }, { max: 1000000000000, min: 1, type: 'number', message: formatMessage('Amount of tokens minted per transaction. Min: 1, Max: 1,000,000,000,000 （1e12).') }]} label={formatMessage('Amount Per Mint')} name="deployAmountPerMint"
                                    // help={<div style={{ textAlign: 'left',color:'rgba(255, 255, 255, 0.6)',fontSize:14 }}> TotalSupply: </div>}
                                    >
                                        <InputNumber
                                            size="large"
                                            style={{ width: '100%' }}
                                            // min={1}
                                            // max={1000000000000}
                                            precision={0}
                                            addonAfter={
                                                <Tooltip title={<Trans>Amount of tokens minted per transaction. Min: 1, Max: 1,000,000,000,000 （1e12).</Trans>}>
                                                    <QuestionCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                                                </Tooltip>
                                            }
                                        />
                                    </Form.Item>
                                    <Row gutter={[0, 0]}>
                                        <Col offset={sm ? 5 : 0} span={sm ? 19 : 24} style={{ textAlign: 'left', color: 'rgba(255, 255, 255, 0.6)', fontSize: 14 }}>
                                            <Trans>Total Supply</Trans>: <NumberFormat value={totalSupply} isBig decimal={0} />
                                        </Col>
                                    </Row>

                                    <Collapse className="collapse" activeKey={activeKey} onChange={setActiveKey} style={{ padding: 0 }} ghost items={[
                                        {
                                            key: '1',
                                            label: <Row gutter={[0, 0]}> <Col offset={sm ? 4 : 0} span={sm ? 20 : 24}><div className="collapsePanel">{!activeKey.includes('1') ? <Trans>Show More Options</Trans> : <Trans>Hide More Options</Trans>} <div
                                                className="collapseIcon"
                                            >
                                                <DownOutlined /></div>
                                            </div></Col></Row>,

                                            showArrow: false,
                                            children: <>
                                                <Form.Item label={<Trans>Token Name</Trans>} name="deployTokenName"
                                                    rules={[{ type: 'string', min: 1, max: 48 }]}
                                                >
                                                    <Input
                                                        size="large"
                                                        maxLength={48}
                                                        placeholder={formatMessage('less than 48 charaters')}
                                                        addonAfter={
                                                            <Tooltip title={<Trans>Full name of the token. Length: 1-48 characters.</Trans>}>
                                                                <QuestionCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                                                            </Tooltip>
                                                        }
                                                    />
                                                </Form.Item>
                                                <Form.Item label={<Trans>Icon</Trans>} name="deployIcon"

                                                >
                                                    <Input
                                                        size="large"
                                                        addonAfter={
                                                            <Space>
                                                                <Tooltip title={<Trans>Optional. Format: 'metafile://pinid'. You should inscribe your icon file first, then paste the metafile protocol URI here.</Trans>}>
                                                                    <QuestionCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                                                                </Tooltip>
                                                                <Button type="link" icon={<CloudUploadOutlined />} onClick={() => setUploadVisible(true)} />
                                                            </Space>
                                                        }
                                                        suffix={_deployIcon ? <Image src={_deployIcon.replace('metafile://', `https://man${network === 'testnet' ? '-test' : ''}.metaid.io/content/`)} width={24} style={{ width: 24, height: 24, borderRadius: '50%' }} /> : <></>}
                                                        placeholder="metafile://Your-Icon-Pinid"
                                                    />
                                                </Form.Item>
                                                <ConfigProvider
                                                    theme={{
                                                        components: {
                                                            "Input": {

                                                                "colorSplit": "rgba(253, 253, 253, 0)"
                                                            }
                                                        },
                                                    }}>
                                                    <Form.Item label={<Trans>Decimals</Trans>} name="deployDecimals"
                                                        rules={[{ max: 12, min: 0, type: 'number', message: formatMessage('Decimal Places: Min 0, Max 12. Default is 8.') }]}
                                                    >
                                                        <InputNumber
                                                            size="large"
                                                            style={{ width: '100%' }}
                                                            // min={0}
                                                            // max={12}
                                                            precision={0}
                                                            addonAfter={
                                                                <Tooltip title={formatMessage('Decimal Places: Min 0, Max 12. Default is 8.')}>
                                                                    <QuestionCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                                                                </Tooltip>
                                                            }

                                                        />
                                                    </Form.Item>
                                                </ConfigProvider>

                                                <Form.Item rules={[({ getFieldValue }) => ({
                                                    validator(_, value) {
                                                        if (!value || getFieldValue('deployMaxMintCount') >= value) {
                                                            return Promise.resolve();
                                                        }
                                                        return Promise.reject(new Error(formatMessage('Premine Count cannot be greater than Mint Limit !')));
                                                    },
                                                })]} label={<Trans>Premine Count</Trans>} name="deployPremineCount"

                                                >
                                                    <InputNumber
                                                        size="large"
                                                        style={{ width: '100%' }}
                                                        min={0}

                                                        precision={0}
                                                        addonAfter={
                                                            <Tooltip title={<Trans>Pre-Minted Count. Value must be ≥ 0 and ≤ Mint Limit. If this Token is a fair launch, please enter 0.</Trans>}>
                                                                <QuestionCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                                                            </Tooltip>
                                                        }
                                                    />
                                                </Form.Item>
                                                {
                                                    _deployPremineCount > 0 && <Row gutter={[0, 0]} style={{ marginBottom: 20 }}>
                                                        <Col offset={sm ? 5 : 0} span={sm ? 19 : 24} style={{ textAlign: 'left', color: 'rgba(255, 255, 255, 0.6)', fontSize: 14 }}>
                                                            <Trans>Total Pre-Minted Token Amount</Trans>:  <NumberFormat value={totalPreMint} isBig decimal={0} /><br />
                                                            <Trans>These tokens will be in your wallet once deployment is confirmed.</Trans>
                                                        </Col>
                                                    </Row>
                                                }

                                                <Form.Item label={<Trans>Begin Height</Trans>} name="deployBeginHeight"

                                                >
                                                    <InputNumber
                                                        size="large"
                                                        style={{ width: '100%' }}
                                                        min={0}

                                                        precision={0}

                                                    />
                                                </Form.Item>
                                                <Form.Item label={<Trans>End Height</Trans>} name="deployEndHeight"

                                                >
                                                    <InputNumber
                                                        size="large"
                                                        style={{ width: '100%' }}
                                                        min={0}
                                                        precision={0}

                                                    />
                                                </Form.Item>
                                                <Row gutter={[0, 0]}>
                                                    <Col offset={sm ? 4 : 0} span={sm ? 20 : 24} style={{ marginBottom: 20 }}>
                                                        <Popover title={<Trans>PIN Payment Settings Explanation:</Trans>} content={<Typography style={{ maxWidth: '400px' }}>
                                                            <Typography.Paragraph>
                                                                <Trans>If the deployer sets the PIN Payment Settings, each minting transaction will be checked to ensure that the specified amount of BTC has been paid to the designated address. If the requirements are not met, the minting will be invalid.</Trans>
                                                            </Typography.Paragraph>
                                                            <ul>
                                                                <li>
                                                                    <Typography.Text code strong>
                                                                        <Trans>Pay To</Trans>
                                                                    </Typography.Text>: <Trans>The address to which the payment must be made during minting.</Trans>
                                                                </li>
                                                                <li>
                                                                    <Typography.Text code strong><Trans>Pay Amount</Trans>:</Typography.Text>
                                                                    <Trans>The amount of BTC that must be transferred to the Pay To address during minting.</Trans>
                                                                </li>

                                                            </ul>
                                                        </Typography>}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: "center" }}>
                                                                <Trans>PIN Payment Settings</Trans><QuestionCircleOutlined />
                                                            </div>
                                                        </Popover>
                                                    </Col>
                                                </Row>
                                                <Form.Item label={<Trans>Pay To</Trans>} name="deployPayTo"
                                                    rules={[]}
                                                >
                                                    <Input
                                                        size="large"

                                                        placeholder=""

                                                    />
                                                </Form.Item>
                                                <Form.Item label={<Trans>Pay Amount</Trans>} name="deployPayAmount"
                                                    rules={[{
                                                        min: 1e-8,
                                                        type: 'number',
                                                    }

                                                    ]}
                                                >
                                                    <InputNumber
                                                        size="large"
                                                        style={{ width: '100%' }}


                                                    />
                                                </Form.Item>


                                                <Row gutter={[0, 0]}>
                                                    <Col offset={sm ? 4 : 0} span={sm ? 20 : 24} style={{ marginBottom: 20 }}>
                                                        <Popover title={<Trans>PoP Difficulty Settings</Trans>} content={<Typography style={{ maxWidth: '400px' }}>
                                                            <Typography.Paragraph>
                                                                <Trans>MRC-20 has a unique and innovative difficulty setting called PoP (Proof of PIN). Users can generate and obtain an NFT called a PIN by generating MetaID interaction transactions. Each PIN has corresponding attributes, including rarity, path, etc. The deployer can decide that during the MRC-20 minting process, users need to provide corresponding PIN proofs to obtain minting eligibility.</Trans>
                                                            </Typography.Paragraph>
                                                            <Typography.Paragraph>

                                                                <Trans>The difficulty setting has four parameters:</Trans>

                                                            </Typography.Paragraph>
                                                            <ul>
                                                                <li>
                                                                    <Typography.Text code strong>
                                                                        <Trans>difficulty level</Trans>
                                                                    </Typography.Text>: <Trans>The difficulty level determines that a PIN of the corresponding or higher difficulty level is required to be eligible to mint MRC-20.</Trans>
                                                                </li>
                                                                <li>
                                                                    <Typography.Text code strong><Trans>path</Trans></Typography.Text>
                                                                    : <Trans>determines that a PIN with the corresponding path is required to be eligible to mint MRC-20.</Trans>
                                                                </li>
                                                                <li>
                                                                    <Typography.Text code strong><Trans>count</Trans></Typography.Text>
                                                                    : <Trans>one needs to provide the corresponding number of PINs that meet the difficulty criteria to be eligible to mint MRC-20.</Trans>
                                                                </li>
                                                                <li>
                                                                    <Typography.Text code strong><Trans>creator</Trans></Typography.Text>
                                                                    :<Trans>one needs to provide PINs of certain creators to be eligible to mint MRC-20.</Trans>
                                                                </li>
                                                            </ul>
                                                        </Typography>}>
                                                            <Trans>PoP Difficulty Settings</Trans> <QuestionCircleOutlined /><br />
                                                            <span style={{ textAlign: 'left', color: 'rgba(255, 255, 255, 0.6)', fontSize: 14 }}>(<Trans>Leave them blank if you are not sure what they are.</Trans> )</span>
                                                        </Popover>
                                                    </Col>
                                                </Row>


                                                <Form.Item rules={[]} label={<Trans>Creator</Trans>} name="deployCreator"

                                                >
                                                    <Input
                                                        size="large"
                                                        style={{ width: '100%' }}
                                                    />
                                                </Form.Item>
                                                <Form.Item rules={[]} label={<Trans>Path</Trans>} name="deployPath"

                                                >
                                                    <Input
                                                        size="large"
                                                        style={{ width: '100%' }}
                                                    />
                                                </Form.Item>
                                                <Form.Item rules={[]} label={<Trans>Difficulty Level</Trans>} name="deployDifficultyLevel"

                                                >
                                                    <Select style={{ textAlign: 'left' }} size="large" options={
                                                        network === 'mainnet' ? new Array(10).fill(null).map((_, i) => {
                                                            return { label: `Lv${i + 5}`, value: i + 5 }
                                                        }) : new Array(14).fill(null).map((_, i) => {
                                                            return { label: `Lv${i}`, value: i }
                                                        })}>

                                                    </Select>
                                                </Form.Item>

                                                <Form.Item rules={[]} label={<Trans>Count</Trans>} name="deployCount"

                                                >
                                                    <InputNumber
                                                        size="large"
                                                        style={{ width: '100%' }}
                                                        min={0}
                                                        precision={0}
                                                    />
                                                </Form.Item></>
                                        }
                                    ]}>

                                    </Collapse>




                                </>
                            }
                            if (type === 'transfer') {
                                return <>
                                    <Form.Item label={<Trans>Token</Trans>} name="transferTickerId"
                                        rules={[{ required: true }]}
                                    >
                                        <Select

                                            showSearch

                                            style={{ textAlign: 'left' }} size="large"
                                            placeholder={formatMessage("Select a token")}
                                            options={list.map(item => {
                                                return { label: <div><span style={{ color: 'var(--primary)' }}>{item.balance}</span> {item.tick}</div>, value: item.mrc20Id }
                                            })}
                                        >

                                        </Select>
                                    </Form.Item>
                                    <Form.Item label={<Trans>Amount</Trans>} name="amount" rules={[{ required: true }, { min: new Decimal(1).div(Math.pow(10, transferPrecision)).toNumber(), type: 'number', }]}>
                                        <InputNumber
                                            size="large"
                                            style={{ width: '100%' }}
                                            precision={transferPrecision}
                                        />
                                    </Form.Item>
                                    <Form.Item label={<Trans>Recipient Address</Trans>} name="recipient" rules={[{ required: true }]}>
                                        <Input
                                            size="large"
                                        />
                                    </Form.Item></>
                            }
                            if (type === 'mint') {
                                return <>

                                    <Form.Item label={formatMessage('Ticker / Token ID')} name="tickerId" rules={[{ required: true }]} validateStatus={mintInfoStatus}
                                        help={mintInfoStatus === 'error' ? <div style={{ textAlign: 'left' }}><Trans>This Ticker / Token ID does not correspond to any MRC-20; Please re-enter.</Trans></div> : <></>} >
                                        <Input
                                            size="large"
                                            onChange={handleMintTokenIDChange}
                                        />
                                    </Form.Item>
                                    <Row gutter={[0, 0]}>
                                        <Col offset={sm ? 5 : 0} span={sm ? 19 : 24}> <Spin spinning={mintInfoLoading} style={{ minHeight: 100 }}>

                                            {
                                                IdCoinInfo && <> <div style={{ color: 'var(--primary)', marginBottom: 20 }}><Trans>Detail</Trans></div><IdCoinCard mintMrc20Info={IdCoinInfo} /></>
                                            }

                                            {
                                                (!IdCoinInfo && mintMrc20Info) && <> <div style={{ color: 'var(--primary)', marginBottom: 20 }}><Trans>Detail</Trans></div><MRC20DetailCard mintMrc20Info={mintMrc20Info} /></>
                                            }
                                        </Spin>
                                        </Col>
                                    </Row>
                                    {((!IdCoinInfo || (IdCoinInfo && addressMintState === 1)) && mintMrc20Info && Number(mintMrc20Info.pinCheck.count) > 0) && <>
                                        {(shovel && shovel.length > 0) ?
                                            <Row gutter={[0, 0]}>
                                                <Col offset={sm ? 5 : 0} span={sm ? 19 : 24}>
                                                    <Collapse ghost defaultActiveKey={1} style={{ padding: 0, marginBottom: 20 }} expandIconPosition='end' items={
                                                        [{
                                                            key: 1,
                                                            label: <div style={{ textAlign: 'left' }}><Trans>PINs</Trans> {mintMrc20Info.pinCheck.count && <>(<FormattedMessage id="Select PINs" values={{ count: mintMrc20Info.pinCheck.count }} />)</>}  <Tooltip title={<Trans>MRC-20 has a unique and innovative difficulty setting called PoP (Proof of PIN). Users can generate and obtain an NFT called a PIN by generating MetaID interaction transactions. Each PIN has corresponding attributes, including rarity, path, etc. The deployer can decide that during the MRC-20 minting process, users need to provide corresponding PIN proofs to obtain minting eligibility.</Trans>}>
                                                                <QuestionCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                                                            </Tooltip></div>,
                                                            children: <Form.Item label='' labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} name="pins" rules={[{ required: true }]}

                                                            >
                                                                {/* <Checkbox.Group style={{ display: 'flex' }} >
                                                                    <Row style={{ borderRadius: 8, overflow: 'hidden', maxHeight: 200, overflowY: 'scroll' }}>
                                                                        {shovel?.map(item => {
                                                                            return <Col span={24} key={item.id}><Checkbox  className="customCheckbox" value={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexDirection: 'row-reverse' }}>
                                                                                <div className="value">#{item.number} <a href={`https://man${network === 'mainnet' ? '' : '-test'}.metaid.io/pin/${item.id}`} target='_blank'>  <ArrowRightOutlined style={{ color: 'rgba(255, 255, 255, 0.5)', transform: 'rotate(-0.125turn)' }} /></a> </div></Checkbox></Col>
                                                                        })}

                                                                    </Row></Checkbox.Group> */}
                                                                <SelectPins shovel={shovel} count={Number(mintMrc20Info.pinCheck.count)} network={network} />
                                                            </Form.Item>
                                                        }]
                                                    }></Collapse>
                                                </Col></Row> : <Row gutter={[0, 0]}>
                                                <Col offset={sm ? 5 : 0} span={sm ? 19 : 24}><div className="noPins" onClick={() => { history.push('/market/PIN') }}><FileTextOutlined style={{ fontSize: 36 }} /><div>
                                                    <Trans>No eligible PIN. Go get one.</Trans>
                                                </div></div></Col></Row>
                                        }
                                    </>}
                                    <Row gutter={[0, 0]}>
                                        <Col offset={sm ? 5 : 0} span={sm ? 19 : 24}>
                                            {
                                                (IdCoinInfo && addressMintState === 0) && <> <Card style={{ marginBottom: 20, border: '1px solid #D4F66B' }} styles={{ body: { padding: '10px 15px', textAlign: "left", color: '#D4F66B', fontSize: 12 } }}>
                                                    <Trans>To mint the ID Coin, you need to become a follower of the Deployer. We will help you complete the follow and mint the ID Coin.</Trans>
                                                </Card></>
                                            }
                                        </Col>
                                    </Row>


                                </>
                            }
                            return null;
                        }
                    }
                </Form.Item>








            </Form>
        </ConfigProvider>
        <Row gutter={[0, 0]}>
            <Col offset={sm ? 5 : 0} span={sm ? 19 : 24}>
                {!connected ? (
                    <Button
                        block
                        className="submit"
                        size="large"
                        type="primary"
                        onClick={connect}
                    >
                        <Trans>Connect Wallet</Trans>
                    </Button>
                ) : (
                    <Button
                        block
                        size="large"
                        loading={submiting || comfirming}
                        type="primary"
                        onClick={beforeSubmit}

                        className="submit"
                        disabled={mintMrc20Info && mintMrc20Info.mintable === false}
                    >
                        <Trans>{submitBtnText || ''}</Trans>
                    </Button>
                )}
            </Col>
        </Row>
        <DeployComfirm {...deployComfirmProps} submiting={submiting} />
        <SuccessModal {...successProp}></SuccessModal>
        <ComfirmMintIdCoin show={comfirmVisible} onClose={() => { setComfirmVisible(false) }} idCoin={IdCoinInfo} order={mintIdCoinOrder} submiting={submiting} handleSubmit={submit} />

        <ComfirmTransfer show={transferVisible} onClose={() => { setTransferVisible(false); setTransfeComfirmParams(undefined); setComfirming(false) }} params={transfeComfirmParams} submiting={submiting} handleSubmit={transferMrc20} />
        <ComfirmMintMrc20 show={mintVisible} onClose={() => { setMintVisible(false); setMintComfirmParams(undefined); setComfirming(false) }} params={mintComfirmParams} submiting={submiting} handleSubmit={mintMrc20} />
        <UploadImg show={uploadVisible} onClose={() => { setUploadVisible(false) }} onSuccess={(pid) => {
            form.setFieldValue('deployIcon', `${pid}`);
            setUploadVisible(false);
        }} />
    </div>

} 