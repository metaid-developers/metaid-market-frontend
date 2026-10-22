import { Button, ConfigProvider, Descriptions, message, Spin } from "antd";
import Popup from "../ResponPopup";
import NumberFormat from "../NumberFormat";
import './index.less'
import { useModel } from "umi";
import { useCallback, useEffect, useState } from "react";
import { redeemIdCoinCommit, redeemIdCoinPre } from "@/services/api";
import { buildRedeemPsbt } from "@/utils/idcoin";
import { addUtxoSafe } from "@/utils/psbtBuild";
import SuccessModal, { DefaultSuccessProps, SuccessProps } from "../SuccessModal";
import Trans from "../Trans";

type Props = {
    show: boolean;
    onClose: () => void;
    goOrders: () => void;
    handelRedeem: () => Promise<void>;
    idCoin: API.IdCoin;
    amount: number;
    btcPrice: number;
    assetUtxoIds: string[]
}
export default ({ show, onClose, goOrders, idCoin, amount, btcPrice, handelRedeem, assetUtxoIds }: Props) => {
    const { network, feeRate, btcAddress, authParams } = useModel('wallet');
    const [loading, setLoading] = useState<boolean>(false);
    const [submiting, setSubmiting] = useState<boolean>(false);
    const [redeemOrder, setRedeemOrder] = useState<API.RedeemIdCoinPreRes>();
    const [successProp, setSuccessProp] =
        useState<SuccessProps>(DefaultSuccessProps);
    const redeemPre = useCallback(async () => {
        setLoading(true);
        if (show && assetUtxoIds.length > 0 && btcAddress) {
            const ret = await redeemIdCoinPre(
                network,
                {
                    sellerAddress: btcAddress,
                    assetUtxoIds,
                    networkFeeRate: feeRate,
                    sellCoinAmount: amount.toString(),
                    tickId: idCoin.mrc20Id
                }
                ,
                {
                    headers: {
                        ...authParams,
                    },
                }
            );
            if (ret.code === 0) {
                setRedeemOrder(ret.data)
            }
        } else {
            setRedeemOrder(undefined)
        }
        setLoading(false);
    }, [network, feeRate, btcAddress, show, idCoin])

    const redeem = async () => {
        if (!redeemOrder || !btcAddress) return;
        setSubmiting(true)
        try {
            const { commitTxRaw, revealPrePsbtRaw } = await buildRedeemPsbt(redeemOrder, network, btcAddress, feeRate)

            const commitRes = await redeemIdCoinCommit(network, {
                orderId: redeemOrder.orderId,
                commitTxRaw,
                commitTxOutIndex: 0,
                revealPrePsbtRaw,
            }, {
                headers: {
                    ...authParams,
                },
            })
            if (commitRes.code !== 0) throw new Error(commitRes.message)

            await addUtxoSafe(btcAddress, [
                { txId: commitRes.data.commitTxId, vout: 1 },
                { txId: commitRes.data.txId, vout: 2 },
            ])
            setSuccessProp({
                show: true,
                onClose: () => {
                    setSuccessProp(DefaultSuccessProps);
                    onClose()
                },
                onDown: () => {
                    setSuccessProp(DefaultSuccessProps);
                    onClose()

                },
                title: <Trans>Redeem</Trans>,
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

                    </div>
                ),
            });
        } catch (err) {
            console.error(err)
            message.error(err.message)
        }
        setSubmiting(false)
    }

    useEffect(() => {
        redeemPre()
    }, [redeemPre])

    return <><Popup
        title=''
        modalWidth={452}
        show={show}
        onClose={onClose}
        closable={true}
        bodyStyle={{ padding: "28px 25px" }}
        className="redeemModal"
    >
        <div className="modelTitle">
            <Trans>Confirm Redeem Liquidity</Trans>
        </div>
        <div className="tip"><Trans>You are about to destroy your ID Coin to redeem liquidity. This operation is irreversible and your ID Coin will be burned.</Trans></div>
        <Spin spinning={loading}>


            <div className="cardComfire">
                <div className="title">
                    <Trans>Do you confirm?</Trans>
                </div>
                <Descriptions column={1}
                    labelStyle={{ color: '#FFFFFF', display: 'flex', alignItems: 'center' }}
                    contentStyle={{ flexGrow: 1, justifyContent: 'flex-end', color: 'rgba(255, 255, 255, 0.5)' }}
                    items={[

                        {
                            key: 'Ticker',
                            label: <Trans>Burn ID Coin</Trans>,
                            children: <span style={{ color: '#F68819', fontWeight: 'bold' }}>{idCoin.tick}</span>
                        },


                        {
                            key: 'btcPrice',
                            label: <Trans>Amount</Trans>,
                            children: <NumberFormat value={amount} />
                        },

                        {
                            key: 'Pool',
                            label: <Trans>Redeem BTC</Trans>,
                            children: <NumberFormat value={redeemOrder && redeemOrder.priceAmount || '--'} decimal={8} isBig suffix=' BTC' />
                        },

                    ]}></Descriptions>
            </div>
        </Spin>
        <div className="tip2">
            <Trans>Alternatively, you can go to Orders.exchange to trade at more reasonable prices.</Trans>

        </div>

        <ConfigProvider
            theme={{
                components: {
                    Button: {
                        "defaultBorderColor": "rgb(212, 246, 107)",
                        "defaultColor": "rgb(212, 246, 107)"
                    },
                },
            }}
        >
            <Button onClick={goOrders} size='large' block style={{ marginTop: 35 }}>
                <Trans>Go To Orders.Exchange</Trans>
            </Button>
        </ConfigProvider>
        <Button type="primary" onClick={redeem} disabled={!redeemOrder} size='large' style={{ marginTop: 20 }} block>
            <Trans>Confiirm Redeem</Trans>
        </Button>
    </Popup>
        <SuccessModal {...successProp} />
    </>
}