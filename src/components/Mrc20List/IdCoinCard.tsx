import { Button, Card, Divider, Progress, Space, Tooltip } from "antd"
import MetaIdAvatar from "../MetaIdAvatar";
import { ArrowRightOutlined } from "@ant-design/icons";
import { useModel, history } from "umi";
import NumberFormat from "../NumberFormat";
import './index.less'
import { getMetaIdUrlByNet } from "@/config";
import { openWindowTarget } from "@/utils/utlis";
type Props = {
    record: API.MRC20Info
    handleFollow: (record: API.MRC20Info) => void;
    followed?: boolean;
    showMintNotice?: (record: API.MRC20Info) => void;
}
export default ({ record, handleFollow, followed, showMintNotice }: Props) => {
    const { network } = useModel('wallet')

    const percent = ((Number(record.supply) / Number(record.totalSupply)) * 100) || 0;
    return <Card className="IdCoinCard" bordered={false} style={{ background: '#101110', borderRadius: 16 }} styles={{ body: { padding: '12px 18px' } }} onClick={() => {
        history.push(`/idCoin/${record.tick}`)
    }} >
        <div className="top">
            <div className="topLeft">
                <MetaIdAvatar size={48} avatar={record.deployerUserInfo?.avatar} />
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
                    <Button style={{ height: 24, fontSize: 10 }} shape="round" disabled={followed} size='small' onClick={(e) => { e.stopPropagation(); handleFollow(record) }} type='link'> {followed ? 'Following' : 'Follow'}</Button>

                </div>
            </div>
            <div className="topRight">
                <div className="progress ">
                    <NumberFormat value={percent} precision={2} floor suffix='%' />
                    <Progress className="Progress" percent={percent > 1 ? percent : 1} showInfo={false}>

                    </Progress>
                </div>
                <Space>
                    {
                        showMintNotice && record.mintable && <Button size='small' onClick={(e) => {
                            e.stopPropagation();
                            showMintNotice(record)
                        }} type='primary'>Mint</Button>
                    }
                    <Button size='small' onClick={(e) => {
                        e.stopPropagation();
                        history.push(`/idCoin/${record.tick}`)
                    }} type='primary'>Detail</Button>
                </Space>
            </div>
        </div>
        <Divider />
        <div className="bottom">
            <div className="bottomLeft">
                <div className="item">
                    <div className="label ">Ticker</div>
                    <div className="value tick">{record.tick}</div>
                </div>
                <div className="item">
                    <div className="label">Supply</div>
                    <div className="value"><NumberFormat value={record.supply} /></div>
                </div>

            </div>
            <div className="bottomRight">
                <div className="item">
                    <div className="label">Holders</div>
                    <div className="value"><NumberFormat value={record.holders} /></div>
                </div>
                <div className="item">
                    <div className="label">Floor Price</div>
                    <div className="value"><NumberFormat value={record.floorPrice} decimal={8} isBig suffix=' BTC' /></div>
                </div>
            </div>
        </div>

    </Card>
}
