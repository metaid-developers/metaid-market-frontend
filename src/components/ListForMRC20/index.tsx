import { useModel } from "umi"
import usePageList from "@/hooks/usePageList"
import { getMrc20AddressUtxo, getMrc20Info, getUserMrc20List, sellMRC20Order, transferMrc20Commit, transfertMrc20Pre } from "@/services/api"
import { useEffect, memo, useState, useCallback, useMemo } from "react"
import { Button, Card, ConfigProvider, Descriptions, InputNumber, List, message } from "antd"
import { CheckOutlined } from "@ant-design/icons"
import { formatMessage, formatSat } from "@/utils/utlis"
import { listMrc20Order, transferMRC20PSBT } from "@/utils/mrc20"
import SuccessModal, { DefaultSuccessProps, SuccessProps } from "../SuccessModal"
import MRC20Icon from "../MRC20Icon"
import NumberFormat from "../NumberFormat"
import Decimal from "decimal.js"
import { getPkScriprt } from "@/utils/orders"
import { addUtxoSafe } from "@/utils/psbtBuild"
import Item from "@/components/Mrc20List/Item";
import './index.less'
import Trans from "../Trans"
import USDPrice from "../USDPrice"
import btc from "@/assets/logo_btc@2x.png";

const tags: Record<string, string> = {
    "MRC-20": "",
    "ID-Coins": "id-coins",


}

type ListChunk = { amount: string; txPoint: string };

function sameQty(left: string | number, right: string | number) {
    try {
        return new Decimal(left).eq(right);
    } catch {
        return false;
    }
}

// Whole on-chain chunks that add up to the listed quantity. Listing those
// chunks only needs one wallet signature each. A quantity that cuts through
// a chunk has to be split first (commit + reveal + list).
function chunksCovering(chunks: ListChunk[], amount: number): ListChunk[] | null {
    let target: Decimal;
    try {
        target = new Decimal(amount);
    } catch {
        return null;
    }
    if (!target.gt(0) || chunks.length > 12) return null;
    const exact = chunks.find((item) => sameQty(item.amount, target.toString()));
    if (exact) return [exact];
    let found: ListChunk[] | null = null;
    const walk = (index: number, sum: Decimal, picked: ListChunk[]): boolean => {
        if (sum.eq(target)) {
            found = picked.slice();
            return true;
        }
        if (sum.gt(target) || index >= chunks.length) return false;
        picked.push(chunks[index]);
        if (walk(index + 1, sum.plus(chunks[index].amount), picked)) return true;
        picked.pop();
        return walk(index + 1, sum, picked);
    };
    walk(0, new Decimal(0), []);
    return found;
}

const ListForMRC20 = ({ tag = 'MRC-20', tick = '' }: { tag?: string, tick?: string }) => {
    const { btcAddress, connect, connected, network, authParams, feeRate } =
        useModel("wallet");
    const [list, setList] = useState<API.UserMrc20Asset[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [successProp, setSuccessProp] =
        useState<SuccessProps>(DefaultSuccessProps);
    const [checkList, setCheckList] = useState<string[]>([]);
    const [sellPrices, setSellPrices] = useState<Record<string, number>>({});
    const [sellAmounts, setSellAmounts] = useState<Record<string, number>>({});
    const [submiting, setSubmiting] = useState<boolean>(false);
    const fetchList = useCallback(async () => {
        if (!btcAddress) return;
        setLoading(true);
        const { code, data } = await getUserMrc20List(network, { address: btcAddress, cursor: 0, size: 50 });
        let _list: API.UserMrc20Asset[] = data && data.list || []
        if (tick) {
            _list = _list.filter((item) => item.tick.toUpperCase() === tick.toUpperCase())
        }
        if (_list.length > 0) {
            for (let i = 0; i < _list.length; i++) {
                const _tickInfo = await getMrc20Info(network, { tickId: _list[i].mrc20Id });
                const { data: utxoList, code } = await getMrc20AddressUtxo(network, { address: btcAddress, tickId: _list[i].mrc20Id, cursor: 0, size: 100 }, {
                    headers: {
                        ...authParams,
                    },
                });
                if (code !== 0) { continue }
                const mrc20s: {
                    amount: string;
                    decimals: string;
                    mrc20Id: string;
                    tick: string;
                    txPoint: string;
                }[] = []
                if (utxoList.list.length === 0) continue
                _list[i].tag = utxoList.list[0].tag
                const avlBal = utxoList.list.reduce((a, item) => {
                    if (item.orderId === '' && tags[tag] === item.tag && item.blockHeight !== -1) {
                        const utxoAmount = item.mrc20s.reduce((a, b) => {
                            mrc20s.push(b)
                            return a + Number(b.amount)
                        }, 0);
                        return a + utxoAmount
                    }
                    return a
                }, 0)
                const unconfirmedBal = utxoList.list.reduce((a, item) => {
                    if (item.orderId === '' && tags[tag] === item.tag && item.blockHeight === -1) {
                        const utxoAmount = item.mrc20s.reduce((a, b) => {
                            return a + Number(b.amount)
                        }, 0);
                        return a + utxoAmount
                    }
                    return a
                }, 0)
                const listedBal = utxoList.list.reduce((a, item) => {
                    if (item.orderId !== '' && tags[tag] === item.tag) {
                        const utxoAmount = item.mrc20s.reduce((a, b) => {
                            return a + Number(b.amount)
                        }, 0);
                        return a + utxoAmount
                    }
                    return a
                }, 0)

                _list[i].avlBalance = avlBal.toFixed(Number(_list[i].decimals))
                _list[i].unconfirmedBalance = unconfirmedBal.toFixed(Number(_list[i].decimals))
                _list[i].listedBalance = listedBal.toFixed(Number(_list[i].decimals))
                _list[i].mrc20s = mrc20s
                _list[i].tickInfo = _tickInfo && _tickInfo.data
            }
        }
        setList(_list.filter((item) => item.tag === tags[tag]));
        setLoading(false)


    }, [btcAddress, network, tag, tick])
    useEffect(() => {
        fetchList()
    }, [fetchList])
    const handleCheck = (txPoint: string) => {
        if (checkList.includes(txPoint)) {
            setCheckList(checkList.filter((item) => item !== txPoint));
        } else {
            setCheckList([...checkList, txPoint]);
        }
    };
    const onInputChange = (txPoint: string, amount: number) => {
        setSellPrices((prev) => {
            return {
                ...prev,
                [txPoint]: amount,
            };
        });
    };

    const onAmountInputChange = (txPoint: string, amount: number) => {
        setSellAmounts((prev) => {
            return {
                ...prev,
                [txPoint]: amount,
            };
        });
    };


    const totalStas = useMemo(() => {
        const total = checkList.reduce((a, b) => {
            return a + (sellPrices[b] || 0) * (sellAmounts[b] || 0);
        }, 0);
        return total;
    }, [checkList, sellPrices, sellAmounts]);

    const listItem = async (mrc20Id: string, price: number, amount: number) => {
        if (!btcAddress) return
        const mrc20 = list.find((item) => item.mrc20Id === mrc20Id);
        if (!mrc20 || !mrc20.mrc20s) return;
        const chunks = mrc20.mrc20s.filter((item) => {
            if (!item.txPoint) return false;
            try {
                return new Decimal(item.amount).gt(0);
            } catch {
                return false;
            }
        });
        const cover = chunksCovering(chunks, amount);
        if (cover) {
            const totalSats = new Decimal(price).mul(1e8);
            let used = new Decimal(0);
            for (let i = 0; i < cover.length; i++) {
                const chunk = cover[i];
                const sats = i === cover.length - 1
                    ? totalSats.minus(used)
                    : totalSats.mul(chunk.amount).div(amount).toDecimalPlaces(0, Decimal.ROUND_DOWN);
                used = used.plus(sats);
                const [txId, vout] = chunk.txPoint.split(":");
                const utxo: API.UTXO = {
                    txId,
                    satoshi: 546,
                    satoshis: 546,
                    vout: Number(vout),
                    outputIndex: Number(vout),
                    confirmed: true
                }
                const psbtRaw = await listMrc20Order(utxo, Number(sats.toFixed(0)), network, btcAddress);
                const { code, message } = await sellMRC20Order(network, { assetType: 'mrc20', tickId: mrc20Id, address: btcAddress, psbtRaw }, {
                    headers: {
                        ...authParams,
                    },
                })
                if (code !== 0) {
                    throw new Error(message)
                }
            }
            return
        };
        // transferMRC20
        const { data: utxoList } = await getMrc20AddressUtxo(network, { address: btcAddress, tickId: String(mrc20Id), cursor: 0, size: 100 }, {
            headers: {
                ...authParams,
            },
        });
        if (utxoList.list.length === 0) throw new Error('No UTXO');
        const selectedUtxos = [];
        let totalAmount = 0;
        for (const utxo of utxoList.list) {
            if (utxo.orderId !== '') continue;
            for (const tick of utxo.mrc20s) {
                if (Number(tick.amount) > 0) {
                    totalAmount += Number(tick.amount)
                    selectedUtxos.push({
                        utxoIndex: utxo.outputIndex,
                        utxoTxId: utxo.txId,
                        utxoOutValue: utxo.satoshi,
                        tickerId: mrc20Id,
                        amount: tick.amount,
                        address: utxo.address,
                        pkScript: utxo.scriptPk
                    })
                }
                if (totalAmount >= amount) {
                    break
                }
            }
            if (totalAmount >= amount) {
                break
            }
        }
        if (totalAmount < amount) {
            throw new Error(formatMessage('No available UTXOs. Please wait for existing transactions to be confirmed.'))
        }

        const params: API.TransferMRC20PreReq = {
            networkFeeRate: feeRate,
            tickerId: mrc20Id,
            changeAddress: btcAddress,
            changeOutValue: 546,
            transfers: selectedUtxos,
            mrc20Outs: [{ amount: String(amount), address: btcAddress, outValue: 546, pkScript: getPkScriprt(btcAddress, network).toString('hex') }]
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
        const utxo: API.UTXO = {
            txId: ret.data.revealTxId,
            satoshi: 546,
            satoshis: 546,
            vout: 1,
            outputIndex: 1,
            confirmed: false
        }
        const psbtRaw = await listMrc20Order(utxo, Number(new Decimal(price).times(1e8).toFixed(0)), network, btcAddress);
        const listRes = await sellMRC20Order(network, {
            assetType: 'mrc20',
            tickId: mrc20Id,
            address: btcAddress,
            psbtRaw,
            askType: 1,
            coinAmountStr: amount.toString(),
            utxoOutValue: 546,
        }, {
            headers: {
                ...authParams,
            },
        })
        if (listRes.code !== 0) throw new Error(listRes.message)




    }

    const handleSale = async () => {
        if (checkList.length === 0) return;
        for (let i = 0; i < checkList.length; i++) {
            const order = list.find((item) => item.mrc20Id === checkList[i]);
            if (!sellPrices[checkList[i]]) {

                message.error(` The listing price for  ${order!.tick} has not been set.`);
                return;
            }
            if (!sellAmounts[checkList[i]] || Number(sellAmounts[checkList[i]]) === 0) {
                message.error(` The listing quantity for  ${order!.tick} has not been set.`);
                return;
            }
        }
        setSubmiting(true)
        for (let i = 0; i < checkList.length; i++) {
            const order = list.find((item) => item.mrc20Id === checkList[i]);
            if (!order) continue
            try {
                await listItem(order.mrc20Id, sellPrices[checkList[i]] * sellAmounts[checkList[i]], sellAmounts[checkList[i]]);
            } catch (err: any) {
                console.log(err);
                message.error(` ${order!.tick}: ${err.message}`);
                await fetchList();
                setSubmiting(false)
                return;
            }
        }
        setSuccessProp({
            show: true,
            onClose: () => setSuccessProp(DefaultSuccessProps),
            onDown: () => setSuccessProp(DefaultSuccessProps),
            title: <Trans>List For Sale</Trans>,
            tip: <Trans>Successful</Trans>,
            children: <div className="saleSuccess"></div>,
        });
        setSellPrices({});
        setSellAmounts({});
        setCheckList([]);
        setSubmiting(false)
        await fetchList();
    };

    return <>
        <List
            className="listWrap listMrc20"
            loading={loading}
            grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 3, xl: 3, xxl: 4 }}
            dataSource={list}
            rowKey={"mrc20Id"}
            renderItem={(item) => (
                <List.Item>
                    <Card
                        styles={{ body: { padding: 0 } }}
                        className={
                            checkList.includes(item.mrc20Id)
                                ? "sellCard checked"
                                : "sellCard"
                        }
                    >
                        <div className="cardWrap">
                            <div
                                className="contetn"
                                onClick={() => {
                                    Number(item.avlBalance) > 0 && handleCheck(item.mrc20Id);
                                }}
                            >


                                <div className="checkBox">
                                    {checkList.includes(item.mrc20Id) ? (
                                        <div className="checked">
                                            <CheckOutlined />
                                        </div>
                                    ) : (
                                        <div className="unchecked"></div>
                                    )}
                                </div>
                                <div className="tick">

                                    <Item info={{ tick: item.tick, mrc20Id: item.mrc20Id, metaData: '', tag: tags[tag], ...item.tickInfo }} />
                                </div>
                                <div className="tickAmount" >

                                    <Descriptions labelStyle={{ color: '#FFFFFF', display: 'flex', alignItems: 'center' }}
                                        contentStyle={{ flexGrow: 1, justifyContent: 'flex-end', color: 'rgba(255, 255, 255, 0.5)', whiteSpace: 'nowrap' }}
                                        column={1} items={
                                            [
                                                {
                                                    key: '1',
                                                    label: <Trans>Available</Trans>,
                                                    children: <NumberFormat value={item.avlBalance} precision={item.decimals} suffix={` ${item.tick}`} />
                                                },
                                                {
                                                    key: '2',
                                                    label: <Trans>Listed</Trans>,
                                                    children: <NumberFormat value={item.listedBalance} precision={item.decimals} suffix={` ${item.tick}`} />
                                                },
                                                {
                                                    key: '3',
                                                    label: <Trans>Unconfirmed</Trans>,
                                                    children: <NumberFormat value={item.unconfirmedBalance} precision={item.decimals} suffix={` ${item.tick}`} />
                                                },
                                            ]
                                        } />

                                </div>
                            </div>
                            <div className="inputGroup">
                                <div className="inputWrap">
                                    <div className="label">
                                        <Trans>Quantity</Trans>
                                    </div>
                                    <InputNumber
                                        onChange={(value) => onAmountInputChange(item.mrc20Id, value)}
                                        controls={false}
                                        className="input"
                                        value={sellAmounts[item.mrc20Id]}
                                        // suffix={item.tick}
                                        precision={Number(item.decimals)}
                                        placeholder={formatMessage('Quantity')}
                                        disabled={Number(item.avlBalance) === 0}
                                        // min={(Number(item.amount) / 1e8) < 0.00002 ? 0.00002 : Number(new Decimal(item.amount).div(1e8).toFixed(8))}
                                        max={item.avlBalance}
                                        min={0}
                                        onFocus={() => {
                                            !checkList.includes(item.mrc20Id) && handleCheck(item.mrc20Id);
                                        }}
                                    />
                                </div>

                                <div className="inputWrap">
                                    <div className="label">
                                        <Trans>Per Price</Trans>
                                    </div>
                                    <InputNumber
                                        onChange={(value) => onInputChange(item.mrc20Id, value)}
                                        controls={false}
                                        className="input"
                                        value={sellPrices[item.mrc20Id]}
                                        suffix={<>BTC </>}
                                        placeholder={formatMessage('Per Price')}
                                        disabled={Number(item.avlBalance) === 0}
                                        // min={(Number(item.amount) / 1e8) < 0.00002 ? 0.00002 : Number(new Decimal(item.amount).div(1e8).toFixed(8))}
                                        // min={0.00002}
                                        onFocus={() => {
                                            !checkList.includes(item.mrc20Id) && handleCheck(item.mrc20Id);
                                        }}
                                    />

                                </div>
                            </div>
                            <div className="inputGroup">
                                <div className="inputWrap">
                                    <div className="label">
                                        <Trans>Total Price</Trans>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between', width: '100%', border: '1px solid #3A3A3A', padding: '8px', borderRadius: 8, boxSizing: 'border-box' }}>
                                        <img src={btc} alt="BTC" className="btcIcon" style={{ width: 32, height: 32 }} />
                                        <div>
                                            <NumberFormat value={(sellPrices[item.mrc20Id] || 0) * (sellAmounts[item.mrc20Id] || 0)} suffix=" BTC" /> <USDPrice value={(sellPrices[item.mrc20Id] || 0) * (sellAmounts[item.mrc20Id] || 0)} />
                                        </div>
                                    </div>


                                </div>
                            </div>



                            {/* <div className="btcAmount">
                                {formatSat(sellPrices[item.txPoint] || 0)} BTC
                            </div> */}
                        </div>
                    </Card>
                </List.Item>
            )}
        />
        <div className="totalPrice">
            <div className="label"><Trans>Total Price</Trans></div>
            <div className="aciotns">
                <div className="prices">
                    <div className="sats"><NumberFormat value={totalStas} suffix=" BTC" /> <USDPrice value={totalStas} decimals={0} /> </div>
                    {/* <div className="btc">{formatSat(totalStas)}BTC</div> */}
                </div>
                {connected ? (
                    <Button
                        type="primary"
                        disabled={totalStas === 0}
                        onClick={handleSale}
                        loading={submiting}
                    >
                        <Trans>List For Sale</Trans>
                    </Button>
                ) : (
                    <Button type="primary" onClick={connect}>
                        <Trans>Connect Wallet</Trans>
                    </Button>
                )}
            </div>
        </div>
        <SuccessModal {...successProp}></SuccessModal>
    </>
}
export default memo(ListForMRC20)