import useIntervalAsync from '@/hooks/useIntervalAsync';
import { getMrc20AddressUtxo, getMrc20Info } from '@/services/api';
import { Avatar, Button, ConfigProvider, Divider, Progress, Statistic, Tabs, TabsProps, Typography, Grid, Space, Popover, message } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useMatch, useModel, history } from 'umi';
import './index.less'
import Listed from './components/Listed';
import NumberFormat from '@/components/NumberFormat';
import { LeftOutlined, LinkOutlined, RightOutlined, ShareAltOutlined, XOutlined } from '@ant-design/icons';
import Activeity from './components/Activeity';
import MyActiveity from './components/MyActiveity';
import MetaIdAvatar from '@/components/MetaIdAvatar';
import MRC20Icon from '@/components/MRC20Icon';
import { formatSat } from '@/utils/utlis';
import btcIcon from "@/assets/logo_btc@2x.png";
import copy from 'copy-to-clipboard';
import Trans from '@/components/Trans';
const { useBreakpoint } = Grid;
const items: TabsProps['items'] = [
    {
        key: '1',
        label: 'Listed',
        children: 'Content of Tab Pane 1',
    },
    {
        key: '2',
        label: 'Activity',
        children: 'Content of Tab Pane 2',
    },
    {
        key: '3',
        label: 'My Activity',
        children: 'Content of Tab Pane 3',
    },
]

export default () => {
    const screens = useBreakpoint();
    const match = useMatch('/mrc20/:mrc20Id');
    const { network, btcAddress, authParams } = useModel('wallet')
    const [mrc20Info, setMrc20Info] = useState<API.MRC20TickInfo>();
    const [showListBtn, setShowListBtn] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(true)
    const fetchData = useCallback(async () => {
        if (!match || !match.params.mrc20Id) return;
        const params: any = {};
        if (match.params.mrc20Id.length > 24) {
            params.tickId = match.params.mrc20Id
        } else {
            params.tick = match.params.mrc20Id
        }
        const { data } = await getMrc20Info(network, params);
        setMrc20Info(data);
    }, [match, network])
    const update = useIntervalAsync(fetchData, 100000)

    const fetchUserUtxo = useCallback(async () => {
        try {
            if (!mrc20Info || !btcAddress) throw new Error('no MRC20 or btcAddress')
            const { data: utxoList, code } = await getMrc20AddressUtxo(network, { address: btcAddress, tickId: mrc20Info.mrc20Id, cursor: 0, size: 100 }, {
                headers: {
                    ...authParams,
                },
            });
            let _showListBtn = false;
            if (code === 0) {
                const find = utxoList.list.find((item) => {
                    return item.orderId === '' && item.mrc20s.length > 0
                })
                if (find) {
                    _showListBtn = true
                }
            }
            setShowListBtn(_showListBtn)
        } catch (err) {

        }
        setLoading(false)

    }, [
        btcAddress,
        network,
        authParams,
        mrc20Info
    ])
    useEffect(() => { fetchUserUtxo() }, [fetchUserUtxo])

    const shareX = () => {
        const shareText = `I found an interesting MetaID Token that's currently offering free minting! Join me in getting this ${mrc20Info?.tick} token for free:  ${window.location.href}`;
        const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
        window.open(shareUrl, '_blank');
    }
    const copyLink = () => {
        copy(window.location.href)
        message.success(<Trans>Link copied to clipboard</Trans>)
    }
    return <div className='mrc20Page'>
        <div
            className="pageBack"
            onClick={() => {
                history.back();
            }}
        >
            <LeftOutlined /> <Trans>Back</Trans>
        </div>
        {
            mrc20Info && <div className='mrc20Info'>
                <div className='left'>
                    <MRC20Icon size={102} tick={mrc20Info.tick} metadata={mrc20Info.metaData} />

                    <div className="info">
                        <div className="top">
                            <div className="nameWrap">
                                <div className="name">
                                    <div className='tick'>{mrc20Info.tick} </div>

                                    <Button
                                        type='link'
                                        size='small'
                                        className='btn'
                                        style={{ fontSize: 10 }}
                                    >
                                        MRC-20
                                    </Button>
                                </div>
                                <Typography.Text className="token" copyable={{ text: mrc20Info.mrc20Id }}><span style={{ color: '#fff' }}>{mrc20Info.tokenName}</span>  TokenID: {mrc20Info.mrc20Id.replace(/(\w{4})\w+(\w{5})/, "$1...$2")}</Typography.Text>
                            </div>

                            <div className="detail">
                                <span className='avatars'><span className='metaid'><Trans>Deployer</Trans></span><MetaIdAvatar size={20} avatar={mrc20Info.deployerUserInfo?.avatar || ""} /> {mrc20Info.deployerUserInfo?.name || mrc20Info.deployerAddress.replace(/(\w{5})\w+(\w{3})/, "$1...$2")}</span>
                                <span className='metaid'>MetaID : {mrc20Info.deployerMetaId.replace(/(\w{6})\w+(\w{5})/, "$1...")}</span>
                            </div>
                        </div>


                        <div className="mint colorPrimary">
                            <span><Trans>Minted</Trans> : <NumberFormat value={mrc20Info.totalMinted} /> (<Trans>Mint Limit</Trans>: <NumberFormat value={mrc20Info.mintCount} />) </span>
                            <span><Trans>Supply</Trans> : <NumberFormat value={mrc20Info.totalSupply} /> </span>
                        </div>
                        <div className="slider">
                            <Progress percent={(Number(mrc20Info.supply) / Number(mrc20Info.totalSupply)) * 100} showInfo={false} />
                        </div>
                        <div className="sliderNumber">

                            <NumberFormat value={(Number(mrc20Info.supply) / Number(mrc20Info.totalSupply)) * 100} floor precision={4} suffix=' %' />
                        </div>
                    </div>

                    <Divider type={screens.md ? 'vertical' : 'horizontal'} style={{ height: screens.md ? 75 : 1 }} />
                    <div className="desc">
                        <Statistic valueStyle={{ display: 'flex', alignItems: 'center', fontSize: 16 }} title={<Trans>Total Volume</Trans>} value={formatSat(mrc20Info.totalVolume)} prefix={<img style={{ width: 16, height: 16 }} src={btcIcon}></img>} />
                        <Statistic valueStyle={{ display: 'flex', alignItems: 'center', fontSize: 16 }} title={<Trans>Market Cap</Trans>} value={formatSat(mrc20Info.marketCap)} prefix={<img style={{ width: 16, height: 16 }} src={btcIcon}></img>} />
                        <Statistic valueStyle={{ display: 'flex', alignItems: 'center', fontSize: 16 }} title={<Trans>Floor Price</Trans>} formatter={() => <NumberFormat value={mrc20Info.floorPrice} isBig decimal={8} tiny suffix=' BTC' precision={12} />} />
                        <Statistic valueStyle={{ display: 'flex', alignItems: 'center', fontSize: 16 }} title={<Space size={4} style={{ cursor: 'pointer' }} onClick={() => { history.push('/holders/' + mrc20Info.tick) }}><Trans>Holders</Trans> <RightOutlined style={{ fontSize: 10 }} /></Space>} value={mrc20Info.holders} />
                    </div>
                </div>
                <Space>
                    {showListBtn && <ConfigProvider
                        theme={{
                            components: {
                                Button: {
                                    "defaultBorderColor": "rgb(212, 246, 107)",
                                    "defaultColor": "rgb(212, 246, 107)"
                                },
                            },
                        }}
                    >
                        <Button loading={loading} disabled={!showListBtn} block onClick={() => { history.push('/list/mrc20/' + mrc20Info.tick) }}><Trans>List For Sale</Trans></Button>
                    </ConfigProvider>}





                    {
                        mrc20Info.mintable && <div className='mintBtn'>
                            <Button type='primary' block onClick={() => { history.push('/inscribe/MRC-20/' + mrc20Info.tick) }}><Trans>Mint</Trans></Button>
                        </div>
                    }


                    <Popover content={<div className='sharePop' >
                        <div className="item" onClick={copyLink}>
                            <LinkOutlined /> <Trans>Copy link</Trans>
                        </div>
                        <Divider className='shareDivider' />
                        <div className="item" onClick={shareX}>
                            <XOutlined /> <Trans>Share on X</Trans>
                        </div>
                    </div>} title="">
                        <Button type='text' icon={<ShareAltOutlined />} ></Button>
                    </Popover>

                </Space>



            </div>
        }
        <ConfigProvider
            theme={{
                components: {
                    "Tabs": {
                        "inkBarColor": "rgba(22, 119, 255, 0)",
                        "colorBorder": "rgba(0, 0, 0, 0)",
                        colorBorderSecondary: 'rgba(0, 0, 0, 0)'

                    },
                    "Table": {
                        "borderColor": "rgba(240, 240, 240, 0)"
                    }
                },
            }}
        >
            {mrc20Info && <Tabs size='small' style={{ marginTop: 22 }} defaultActiveKey="1" items={[
                {
                    key: '1',
                    label: <Trans>Listed</Trans>,
                    children: <Listed mrc20Id={mrc20Info.mrc20Id || ''} metaData={mrc20Info.metaData || ''} />,
                },
                {
                    key: '2',
                    label: <Trans>Activity</Trans>,
                    children: <Activeity mrc20Id={mrc20Info.mrc20Id || ''} />,
                },
                {
                    key: '3',
                    label: <Trans>My Activity</Trans>,
                    children: <Activeity mrc20Id={mrc20Info.mrc20Id || ''} showMy />,
                },
                {
                    key: '4',
                    label: <Trans>My Listed</Trans>,
                    children: <Listed mrc20Id={mrc20Info.mrc20Id || ''} showMy metaData={mrc20Info.metaData || ''} />,
                },
            ]} />}
        </ConfigProvider>

    </div>
}