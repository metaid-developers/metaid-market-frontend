import { Col, Form, Input, Row, Grid, Button, InputNumber, message, Tooltip, Typography, Spin, Modal, Card, Collapse } from 'antd';
import './index.less'
import { useModel, useSearchParams, history } from "umi";
import MetaIdAvatar from '@/components/MetaIdAvatar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import NumberFormat from '@/components/NumberFormat';
import SetProfile from '@/components/SetProfile';
import SeleceFeeRateItem from '../inscribe/components/SeleceFeeRateItem';
import { checkUserCanDeployIdCoin, deployIdCoinCommit, deployIdCoinPre, getIdCoinInfo } from '@/services/api';
import { buildDeployIdCointPsbt } from '@/utils/idcoin';
import { testnet } from 'bitcoinjs-lib/src/networks';
import { addUtxoSafe } from '@/utils/psbtBuild';
import SuccessModal, { DefaultSuccessProps, SuccessProps } from '@/components/SuccessModal';
import { DownOutlined, EditFilled, InfoCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import ComfirmLaunch from './components/ComfirmLaunch';
import IdCoinDetail from './components/IdCoinDetail';
import CustomizeRequiredMark from '@/components/CustomReqMark';
import LiqPerMintNotice from '@/components/LiqPerMintNotice';
import safeIcon from '@/assets/safe.svg';
import userIcon from '@/assets/user.svg';
import idCoinIcon from '@/assets/idCoin.svg';
import down from '@/assets/chevron-down.svg';
import Trans from '@/components/Trans';
import { formatMessage } from '@/utils/utlis';
const { useBreakpoint } = Grid;
export default () => {
    const [form] = Form.useForm();
    const [comfirmVisible, setComfirmVisible] = useState(false)
    const _followersNum = Form.useWatch('followersNum', form);
    const _amountPerMint = Form.useWatch('amountPerMint', form);
    const _liquidityPerMint = Form.useWatch('liquidityPerMint', form);
    const [order, setOrder] = useState<API.DeployIdCoinPreRes>();
    const [activeKey, setActiveKey] = useState<string>('');
    const [checkAddrCanDeploy, setCheckAddrCanDeploy] = useState<{ canDeploy: boolean, msg: string }>();
    const [fields, setFields] = useState<{
        tick: string,
        followersNum: number,
        amountPerMint: number,
        liquidityPerMint: number,
    }>();
    const [successProp, setSuccessProp] =
        useState<SuccessProps>(DefaultSuccessProps);
    const totalSupply = useMemo(() => {
        if (_amountPerMint && _followersNum) {
            return BigInt(Math.round(_amountPerMint)) * BigInt(Math.round(_followersNum))
        } else {
            return BigInt(0)
        }
    }, [_followersNum, _amountPerMint])


    const InitialPrice = useMemo(() => {
        if (_amountPerMint && _liquidityPerMint) {
            return Number(_liquidityPerMint) / Number(_amountPerMint)
        } else {
            return BigInt(0)
        }
    }, [_liquidityPerMint, _amountPerMint])
    const { sm } = useBreakpoint();
    const [visible, setVisible] = useState(false);
    const [editVisible, setEidtVisible] = useState(false);
    const { authParams, connected, connect, feeRate, network, initializing, btcConnector, btcAddress, avatar, userName, metaid } =
        useModel("wallet");
    const [submiting, setSubmiting] = useState<boolean>(false);
    //if launched
    const [loading, setLoading] = useState(true)
    const [idCoin, setIDCoin] = useState<API.IdCoin>()
    const fetchOrder = useCallback(async () => {
        if (btcAddress) {
            setLoading(true)
            const tickExist = await getIdCoinInfo(network, { issuerAddress: btcAddress });
            if (tickExist.code === 0) {
                setIDCoin(tickExist.data)
            } else {
                const checkRet = await checkUserCanDeployIdCoin(network, { address: btcAddress });
                if (checkRet.code === 0) {
                    setCheckAddrCanDeploy(checkRet.data)
                }
            }
            setLoading(false)
        } else {
            setIDCoin(undefined)
        }
        setLoading(false)
    }, [btcAddress])
    useEffect(() => {
        fetchOrder()
    }, [fetchOrder])

    const launch = async () => {
        if (!connected || !metaid || !btcAddress || !order) return;
        if (!userName) {
            setVisible(true);
            return;
        }

        await form.validateFields();
        setSubmiting(true);

        try {
            const { rawTx } = await buildDeployIdCointPsbt(
                order,
                feeRate,
                btcAddress,
                network
            )
            const commitRes = await deployIdCoinCommit(network, {
                orderId: order.orderId,
                commitTxOutIndex: 0,
                commitTxRaw: rawTx,
            }, { headers: authParams })
            console.log(commitRes)
            if (commitRes.code !== 0) throw new Error(commitRes.message)
            await addUtxoSafe(btcAddress, [{ txId: commitRes.data.commitTxId, vout: 1 }])
            // message.success('Successfully launched')

            setFields(undefined)
            setOrder(undefined)
            fetchOrder()
            setComfirmVisible(false)
            setSuccessProp({
                show: true,
                onClose: () => {
                    setSuccessProp(DefaultSuccessProps);
                    form.resetFields();
                },
                onDown: () => {
                    setSuccessProp(DefaultSuccessProps);
                    form.resetFields();
                    history.push('/mrc20History?tab=ID-Coins Deploy')

                },
                title: <Trans>Launch</Trans>,
                tip: <Trans>Successful</Trans>,
                okText: 'OK',
                txs: [{
                    label: 'Reveal TxId',
                    txid: commitRes.data.revealTxId
                }, {
                    label: 'Commit TxId',
                    txid: commitRes.data.commitTxId
                }
                ],
                children: (
                    <div className="inscribeSuccess">

                        <div className="tips">
                            <InfoCircleOutlined />
                            <span><Trans>Current deployment transaction status is Pending. Please wait for the deployment transaction to be confirmed before minting this token.</Trans></span>
                        </div>
                    </div>
                ),
            });

        } catch (err) {
            message.error(err.message)
        }
        setSubmiting(false);
    }

    const launchBefore = async () => {
        if (!connected || !metaid || !btcAddress) return;
        if (!userName) {
            setVisible(true);
            return;
        }
        await form.validateFields();
        try {
            const { tick, description, followersNum, amountPerMint, liquidityPerMint } = form.getFieldsValue();
            const tickExist = await getIdCoinInfo(network, { issuerAddress: btcAddress });
            if (tickExist.code === 0 && tickExist.data.mrc20Id) {
                throw new Error('You have already launched an ID-Coin. Please do not launch it again.')
            }
            const issuerSign: any = await window.metaidwallet.btc.signMessage(tick)
            if (issuerSign.status) throw new Error(issuerSign.status)
            const payload: API.DeployIdCoinPreReq = {
                networkFeeRate: feeRate,
                tick,
                tokenName: tick,
                description,
                issuerMetaId: metaid,
                issuerAddress: btcAddress,
                issuerSign: issuerSign,
                message: description,
                followersNum,
                amountPerMint,
                liquidityPerMint: Number(BigInt(liquidityPerMint * 1e8))
            }
            const { code, data, message: msg } = await deployIdCoinPre(network, payload, { headers: authParams });
            if (code !== 0) throw new Error(msg);
            const { fee } = await buildDeployIdCointPsbt(
                data,
                feeRate,
                btcAddress,
                network,
                false,
                false
            )

            setFields({ tick, followersNum, amountPerMint, liquidityPerMint, gasFee: fee })
            setOrder(data)
            setComfirmVisible(true)
        } catch (err: any) {
            message.error(err.message)
        }
    }

    useEffect(() => {
        if (!btcAddress) {
            form.resetFields()
        }
    }, [btcAddress])

    useEffect(() => {
        if (!initializing && connected) {
            if (!userName) {
                setVisible(true)
            } else {
                setVisible(false)
                form.setFieldsValue({ tick: userName })
            }
        }
    }, [connected, userName, initializing])
    return <div className="launchPage">
        <Spin spinning={initializing || loading} style={{ minHeight: '50vh' }}>
            {(initializing || loading) ? <></> : idCoin ? <IdCoinDetail idCoid={idCoin} /> :
                <div className='launchWrap'>
                    <div className='launchCollapse'>
                        <Collapse className="" style={{ padding: 0 }} ghost activeKey={activeKey} items={[
                            {
                                key: '1',
                                label: <div className='collapseLabel'>
                                    <div className="title">
                                        <Trans>ID Coin: Tokenize Your Influence</Trans>
                                    </div>
                                    <div className="subTitle">
                                        <Trans>Launch a Liquid Personal Token Just for Your Followers</Trans>

                                    </div>

                                </div>,

                                showArrow: false,
                                children: <>
                                    <div className="card">
                                        <div className="item">
                                            <img src={idCoinIcon} alt="" className='icon' />
                                            <div>
                                                <Trans>ID Coin is an MRC-20 token deployment & minting use case example from metaid.market, showcasing MRC-20's possibilities.</Trans>
                                            </div>
                                        </div>
                                        <div className="item">
                                            <div className="icon">99</div>
                                            <div>
                                                <Trans>Only 99 deployments available for now.</Trans>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="tip">
                                        <Trans>This is an experimental feature, be aware of potential risks.</Trans>
                                    </div>
                                </>,

                            }
                        ]}>

                        </Collapse>
                        <div className="collapseIcon">
                            <Button type='text' onClick={() => setActiveKey(activeKey === '1' ? '' : '1')}>
                                <img src={down} alt="" className={`${activeKey === '1' ? 'spanRotate' : 'spanReset'}`} />
                            </Button>

                        </div>
                    </div>

                    <Card bordered={false} styles={{ body: { boxSizing: 'border-box', width: 784, maxWidth: 'calc(100vw - 24px)', display: 'flex', flexDirection: 'column', alignContent: 'center' } }}>
                        <div className="user">
                            <div className='userAvatar'>
                                <MetaIdAvatar avatar={avatar} size={100} />
                                {
                                    (connected && !initializing) && <div className='mask' onClick={() => { setEidtVisible(true) }}>
                                        <EditFilled />
                                    </div>
                                }


                            </div>

                            <div className="name"><Trans>{userName || 'Unnamed'}</Trans></div>
                            <div className="metaid">Metaid:{metaid ? metaid.replace(/(\w{6})\w+(\w{3})/, "$1...") : '--'}</div>
                        </div>

                        <Form
                            labelCol={{ span: 9 }}
                            wrapperCol={{ span: 15 }}
                            labelAlign='left'
                            form={form}
                            layout="horizontal"
                            requiredMark={CustomizeRequiredMark}
                            variant="borderless"
                            className='formWrap'
                            colon={false}
                            initialValues={{
                                // tick: 'OhMyCoin',
                                followersNum: 1000,
                                amountPerMint: 10000,
                                liquidityPerMint: 0.001,
                                // description: "come on!"
                            }}
                        >

                            <Row gutter={[24, 0]}>
                                <Col md={12} xs={24} >
                                    <Form.Item label={<Trans>Ticker</Trans>} name='tick'
                                        rules={[{ required: true }, { type: 'string', min: 2, max: 24 }, { pattern: new RegExp(/^[a-zA-Z0-9\-]*$/), message: "No Space or Special Characters Allowed" }, () => ({
                                            async validator(_, value) {
                                                if (!value || value.length < 2) {
                                                    return Promise.resolve();
                                                }

                                                const { data } = await getIdCoinInfo(network, { tick: value.toUpperCase() });
                                                if (data && data.mrc20Id) {
                                                    return Promise.reject(new Error(formatMessage('This tick already exists.')));
                                                }

                                            },
                                        })]}
                                        validateTrigger="onBlur" className='formItem'>
                                        <Input placeholder={formatMessage("2~24 Charaters")} />
                                    </Form.Item>
                                </Col>
                                <Col md={12} xs={24} >
                                    <Form.Item label={<Trans>Followers Limit</Trans>} name='followersNum' rules={[{ required: true }, { type: 'number', min: 1, max: 1000000000000, message: '1-1e12 ' }]} className='formItem'>
                                        <InputNumber precision={0} placeholder="Followers Limit" style={{ width: '100%' }} controls={false} addonAfter={
                                            <Tooltip title={<Trans>Followers Limit：Limit on the total number of followers. The minimum number of followers is 1, while the maximum number can reach 1,000,000,000,000（1e12）</Trans>}>
                                                <QuestionCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                                            </Tooltip>
                                        } />
                                    </Form.Item>
                                </Col>
                                <Col md={12} xs={24} >
                                    <Form.Item label={<Trans>Amount Per Mint</Trans>} name='amountPerMint' rules={[{ required: true }, { max: 1000000000000, min: 1, type: 'number', message: '1-1e12 ' }]} className='formItem'>
                                        <InputNumber precision={0} placeholder="Amount Per Mint" style={{ width: '100%' }} addonAfter={
                                            <Tooltip title={<Trans>Amount of tokens minted per transaction. Min: 1, Max: 1,000,000,000,000 （1e12).</Trans>}>
                                                <QuestionCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                                            </Tooltip>
                                        } controls={false} />

                                    </Form.Item>
                                    <div className='totalSupply'> <Trans>Total Supply</Trans>: <NumberFormat value={totalSupply} isBig decimal={0} /></div>

                                </Col>
                                <Col md={12} xs={24} >
                                    <Form.Item label={<Trans>Liquidity Per Mint</Trans>} name='liquidityPerMint' rules={[{ required: true }, { type: 'number', min: 0.0001, max: 10, message: '0.0001-10 BTC' }]} className='formItem'>
                                        <InputNumber precision={8} formatter={(value) => `${value} BTC`} parser={(value) => value?.replace(' BTC', '') as unknown as number} placeholder="Liquidity Per Mint" style={{ width: '100%' }} controls={false} addonAfter={
                                            <Tooltip title={<LiqPerMintNotice />}>
                                                <QuestionCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                                            </Tooltip>
                                        } />
                                    </Form.Item>
                                    <div className='totalSupply'> <Trans>Initial Price</Trans>   <NumberFormat value={InitialPrice} isBig decimal={0} suffix=' BTC' /></div>
                                </Col>
                                <Col md={24} xs={24} >
                                    <Form.Item label={<Trans>Message</Trans>} name='description' className='formItem' labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} rules={[{ max: 500, type: 'string' }]} >
                                        <Input.TextArea style={{ textAlign: 'start' }} placeholder={formatMessage("Leave your message to your followers.")} />
                                    </Form.Item>
                                </Col>
                                {/* <Col md={24} xs={24} >
                    <Form.Item label="FeeRate" required name='feeRate' className="formItem">
                        <SeleceFeeRateItem feeRates={feeRates} />
                    </Form.Item>
                </Col> */}

                            </Row>

                        </Form>
                    </Card>
                    <Col span={24} style={{ marginTop: 32 }}>
                        {!connected ? (
                            <Button
                                block
                                className="submit"
                                size="large"
                                type="primary"
                                onClick={connect}
                                style={{ height: 48 }}
                            >
                                <Trans>Connect Wallet</Trans>
                            </Button>
                        ) : (
                            <Button
                                block
                                size="large"
                                loading={submiting}
                                type="primary"
                                onClick={launchBefore}
                                style={{ height: 48, textTransform: 'capitalize' }}
                                className="submit"
                                disabled={checkAddrCanDeploy?.canDeploy ? false : true}
                            >
                                <Trans>{checkAddrCanDeploy?.canDeploy ? 'Launch' : checkAddrCanDeploy?.msg}</Trans>
                            </Button>
                        )}
                    </Col>
                    <Row className='requirement' gutter={[6, 6]}>
                        <Col span={24} className="title">
                            <Trans>Requirement</Trans>
                        </Col>
                        <Col md={12} xs={24} className='item' >
                            <img src={safeIcon} alt="" />
                            <Trans>{`ID Coin Deployment: Users w/${'>'}5 MetalD PINs`}</Trans>
                        </Col>
                        <Col md={12} xs={24} className='item' >
                            <img src={userIcon} alt="" />
                            <Trans>ID Coin Minting: Only followers of deployer can mint</Trans>
                        </Col>
                    </Row>
                </div>}
        </Spin>
        <SetProfile show={visible} editVisible={editVisible} setEditVisible={() => { setVisible(false); setEidtVisible(true) }} onClose={() => { setVisible(false); setEidtVisible(false) }} />
        <SuccessModal {...successProp}></SuccessModal>
        <ComfirmLaunch show={comfirmVisible} fields={fields} submiting={submiting} handleSubmit={launch} order={order} onClose={() => setComfirmVisible(false)}></ComfirmLaunch>
    </div>
}