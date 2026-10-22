import { getMrc20List } from "@/services/api"
import { ConfigProvider, Table, TableColumnsType, Grid, Progress, Button, Tooltip, message, List, TableProps } from "antd"
import { useModel, history } from "umi"
import NumberFormat from "../NumberFormat";
import { useEffect, useState } from "react";
import MetaIdAvatar from "../MetaIdAvatar";
import { ArrowRightOutlined } from "@ant-design/icons";
import { getMetaIdUrlByNet } from "@/config";
import IdCoinCard from "./IdCoinCard";
import Sorter from "../Sorter";
import { openWindowTarget } from "@/utils/utlis";
import { addUtxoSafe } from "@/utils/psbtBuild";
import Trans from "../Trans";
const { useBreakpoint } = Grid;
type OnChange = NonNullable<TableProps<API.MRC20Info>['onChange']>;
type GetSingle<T> = T extends (infer U)[] ? U : never;
type Sorts = GetSingle<Parameters<OnChange>[2]>;

export default () => {
    const screens = useBreakpoint();
    const { network, btcAddress, connect, connected, btcConnector, feeRate } = useModel("wallet")
    const { searchWord, IdCoinPage: page, setIdCoinPage: setPage } = useModel('mrc20')
    const [list, setList] = useState<API.MRC20Info[]>([]);
    const [followedMetaIds, setFollowedMetaIds] = useState<string[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [size, setSize] = useState<number>(10);
    const [orderBy, setOrderBy] = useState<string>('deployTime');
    const [sortType, setSortType] = useState<1 | -1>(1);

    useEffect(() => {
        let didCancel = false;
        const fetchData = async () => {
            setLoading(true);
            const { code, message: msg, data } = await getMrc20List(network, {
                cursor: page * size,
                size,
                searchTick: searchWord,
                orderBy,
                sortType,
                tag: 'id-coins',
            });
            if (didCancel) return
            if (code !== 0) {
                message.error(msg)
            }
            if (data && data.list) {
                setList(data.list);
                setTotal(data.total);
            } else {
                setList([])
                setTotal(0)
            }
            setLoading(false);
        };
        fetchData()
        return () => {
            didCancel = true;
        };
    }, [network, page, size, orderBy, sortType, searchWord])

    const handleFollow = async (record: API.MRC20Info) => {
        if (!connected) {
            await connect();
            return
        }
        if (!btcConnector || !btcAddress) return
        try {
            const followRes = await btcConnector.inscribe({
                inscribeDataArray: [
                    {
                        operation: 'create',
                        path: '/follow',
                        body: record.deployerMetaId,
                        contentType: 'text/plain;utf-8',
                        flag: "metaid",
                    },
                ],
                options: {
                    noBroadcast: 'no',
                    feeRate: feeRate,
                },
            });
            if (followRes.status) throw new Error(followRes.status)
            if (followRes && followRes.revealTxIds && followRes.revealTxIds[0]) {
                message.success(<Trans>Follow successfully! Please wait for the transaction to be confirmed!</Trans>)
                setFollowedMetaIds([...followedMetaIds, record.deployerMetaId])
                await addUtxoSafe(btcAddress, [{ txId: followRes.commitTxId, vout: 1 }])
            } else {
                throw new Error('Follow failed')
            }
        } catch (err: any) {
            message.error(err.message || 'Follow failed')
        }
    }

    const columns: TableColumnsType<API.MRC20Info> = [
        {
            title: <Trans>Name</Trans>,
            key: 'name',
            dataIndex: 'deployerUserInfo',
            render: (_, record) => {
                const isFollowing = followedMetaIds.includes(record.deployerMetaId)
                return <div className="idCoinDeploy">
                    <MetaIdAvatar size={screens.xl ? 72 : 50} avatar={record.deployerUserInfo?.avatar} />
                    <div>
                        <div className="nameWrap">
                            <div className="name">
                                <Tooltip title={record.deployerUserInfo?.name || record.deployerAddress}>{record.deployerUserInfo?.name || record.deployerAddress.replace(/(\w{5})\w+(\w{3})/, "$1...$2")}</Tooltip>
                            </div>
                            <a onClick={(e) => e.stopPropagation()} href={`${getMetaIdUrlByNet(network)}${record.deployerMetaId}`} target={openWindowTarget()}>
                                <ArrowRightOutlined style={{ color: '#fff', transform: 'rotate(-0.125turn)' }} />
                            </a>
                        </div>
                        <div className="metaid">MetaID :<Tooltip title={record.deployerMetaId}>{record.deployerMetaId.replace(/(\w{6})\w+(\w{5})/, "$1...")}</Tooltip> </div>
                        <Button style={{ height: 24, fontSize: 10 }} shape="round" disabled={isFollowing} size='small' onClick={(e) => { e.stopPropagation(); handleFollow(record) }} type='link'> <Trans>{isFollowing ? 'Following' : 'Follow'}</Trans></Button>

                    </div>
                </div>
            },
            // fixed: 'left',
            width: 200
        },
        {
            title: <Trans>Ticker</Trans>,
            dataIndex: 'tick',
            key: 'tick',
            width: 110,
            align: 'center',
            sorter: true,
            ellipsis: true,
            render: (item) => {
                return <div style={{ color: '#F68819', fontWeight: 'bold' }}>{item}</div>
            }
        },
        {
            title: <Trans>Supply</Trans>,
            dataIndex: 'supply',
            key: 'supply',
            sorter: true,
            align: 'center',
            width: 160,
            render: (item) => {
                return <NumberFormat value={item} />
            }
        },
        {
            title: <Trans>Holders</Trans>,
            dataIndex: 'holders',
            key: 'holders',
            sorter: true,
            align: 'center',
            width: 100,
        },
        {
            title: <Trans>Message</Trans>,
            dataIndex: 'metaData',
            key: 'metaData',
            align: 'center',
            ellipsis: {
                showTitle: false,
            },

            render: (metaData) => {
                try {
                    return <Tooltip placement="topLeft" title={JSON.parse(metaData).message}>{JSON.parse(metaData).message} </Tooltip>
                } catch (e) {
                    return <></>
                }
            },
            width: 120
        },
        {
            title: <Trans>Progress%</Trans>,
            dataIndex: 'progress',
            key: 'progress',
            width: 200,
            align: 'center',
            sorter: true,
            render: (_, record) => {
                const percent = ((Number(record.supply) / Number(record.totalSupply)) * 100) || 0;
                return <div className="progressAndMint">

                    <div className="progress ">
                        <NumberFormat value={percent} floor precision={2} suffix='%' />
                        <Progress className="Progress" percent={percent > 1 ? percent : 1} showInfo={false}>

                        </Progress>
                    </div>


                </div>
            }
        },

    ]

    return <ConfigProvider
        theme={{
            components: {
                "Tabs": {
                    "inkBarColor": "rgba(22, 119, 255, 0)",
                    "colorBorder": "rgba(0, 0, 0, 0)",
                    // colorBorderSecondary:'rgba(0, 0, 0, 0)'

                },
                "Table": {
                    "borderColor": "rgba(240, 240, 240, 0)",
                    "rowHoverBg": "rgba(110, 208, 63, 0.13)",
                    // "fontSize": 16
                }
            },
        }}>
        {screens.md ? <Table
            style={{ margin: screens.xl ? '0 20px ' : '0 0px' }}
            columns={columns.filter(item => (item as any).dataIndex !== 'metaData' || screens.xl)}
            rowKey={(record) => record.mrc20Id}
            dataSource={list}
            size={screens.xl ? 'middle' : 'small'}
            pagination={{
                position: ['bottomCenter'],
                pageSize: size,
                current: page + 1,
                total,
                onChange: (page, pageSize) => {
                    setPage(page - 1);
                    setSize(pageSize || 10);
                },
            }}
            scroll={{ x: 800 }}
            loading={loading}
            onChange={(_1, _2, sorter) => {
                const { field, order } = sorter as Sorts;
                if (order) {
                    setOrderBy((field || '').toString());
                    setSortType(order === 'ascend' ? 1 : -1);
                } else {
                    setOrderBy('deployTime');
                    setSortType(1);
                }
            }}
            onRow={(record) => {
                return {
                    style: { cursor: 'pointer' },
                    onClick: () => {
                        history.push(`/idCoin/${record.tick}`)
                    },
                }
            }}
        /> : <div>
            <Sorter sorters={[
                { label: 'Ticker', key: 'tick' },
                { label: 'Supply', key: 'supply' },
                { label: 'Holders', key: 'holders' },
                { label: 'Progress', key: 'progress' },
            ]} sortKey={orderBy} sortType={sortType} setSortKey={setOrderBy} setSortType={setSortType} />
            <List
                loading={loading}
                grid={{ gutter: 16, xs: 1, sm: 1, md: 1, lg: 1, xl: 1, xxl: 1 }}
                dataSource={list}
                renderItem={(item) => (
                    <List.Item>
                        <IdCoinCard record={item} handleFollow={handleFollow} />
                    </List.Item>
                )}
                rowKey={"mrc20Id"}
                pagination={{
                    onChange: (page, pageSize) => {
                        setPage(page - 1);
                        setSize(pageSize || 10);
                    },
                    position: "bottom",
                    align: "center",
                    pageSize: 10,
                    total: total,
                    current: page + 1,
                }}
            /></div>}


    </ConfigProvider>
}
