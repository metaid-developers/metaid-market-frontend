import MetaIdAvatar from "@/components/MetaIdAvatar"
import NumberFormat from "@/components/NumberFormat"
import { Button, Card, Col, Progress, Row, Space, Statistic, Tooltip, Typography } from "antd"
import btcIcon from "@/assets/logo_btc@2x.png";
import arrow from '@/assets/list_icon_ins.svg'
import './details.less'
import { formatSat } from "@/utils/utlis"
import IdCoinMessage from "@/components/IdCoinMessage";
import { history } from 'umi'
import { ArrowRightOutlined, RightOutlined } from "@ant-design/icons";
import IDCoinAllMessage from "@/components/IdCoinMessage/IDCoinAllMessage";
import Trans from "@/components/Trans";
type Props = {
    idCoid: API.IdCoin | undefined
}
const DescItem = ({ label, value, dark }: { label: string|React.ReactNode, dark?: boolean, value: React.ReactNode }) => {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0px 23px', lineHeight: '52px', background: 'rgba(25, 27, 24, 0.84)', borderRadius: 8 }}>
        <div style={{ fontSize: '16px', color: dark ? 'rgba(255, 255, 255, 0.5)' : '#fff' }}>{label}</div>
        <div style={{ fontSize: '16px' }}>{value}</div>
    </div>
}
export default ({ idCoid }: Props) => {
    if (!idCoid) return <></>
    return <Row gutter={[20, 20]} style={{ marginTop: 100, width: 784, maxWidth: 'calc(100vw - 24px)' }} className="idCoinDetails">
        <Col span={24}>
            <Card bordered={false} styles={{ body: { padding: '12px 23px' } }} >
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: "center" }}>
                    <MetaIdAvatar avatar={idCoid.deployerUserInfo.avatar} size={62} />
                    <div className="right" style={{ flexGrow: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                            <div>
                                <Typography.Title level={4} style={{ margin: 0 }}>
                                    {idCoid.tick}
                                </Typography.Title>
                                <Typography.Text copyable={{ text: idCoid.deployerMetaId }} className="metaid"> MetaID: {idCoid.deployerMetaId.replace(/(\w{6})\w+(\w{5})/, "$1...")}</Typography.Text>
                            </div>
                            <div style={{ display: 'flex', gap: 13, justifyContent: "center", alignItems: "center" }}>


                                <div style={{ display: 'flex', gap: 4, justifyContent: "center", flexDirection: 'column', alignItems: "center" }}>
                                    <Typography.Text className="ticker"><NumberFormat value={idCoid.followersCount} /> </Typography.Text>
                                    <div>
                                       <Trans>Followers</Trans> 
                                    </div>
                                </div>
                                <Button shape='circle' type="text" style={{ background: '#21251A' }} onClick={() => { history.push(`/idCoin/${idCoid.tick}`) }}>
                                    <img src={arrow} alt="" />
                                </Button>
                            </div>

                        </div>
                    </div>
                </div>
                <div>
                    <div className="mint colorPrimary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
                        <span><Trans>Minted</Trans> : <NumberFormat value={idCoid.totalMinted} />  </span>
                        <span><Trans>Supply</Trans> : <NumberFormat value={idCoid.totalSupply} /> </span>
                    </div>
                    <div className="slider" style={{ marginTop: 0 }}>
                        <Progress percent={Number(idCoid.supply / idCoid.totalSupply) * 100} showInfo={false} />
                    </div>
                    <div className="sliderNumber">

                        <NumberFormat value={(Number(idCoid.supply / idCoid.totalSupply) * 100) || 0} floor precision={4} suffix=' %' />
                    </div>
                </div>
            </Card>
        </Col>
        <Col span={24}>
            <Card bordered={false} >
                <Row gutter={[20, 20]}>
                    <Col xs={12} sm={12} md={6} lg={6} xl={6} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Statistic valueStyle={{ display: 'flex', alignItems: 'center', fontSize: 16 }} title={<Trans>Total Volume</Trans>} value={formatSat(idCoid.totalVolume)} prefix={<img style={{ width: 16, height: 16 }} src={btcIcon}></img>} />
                    </Col>
                    <Col xs={12} sm={12} md={6} lg={6} xl={6} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Statistic valueStyle={{ display: 'flex', alignItems: 'center', fontSize: 16 }} title={<Trans>Market Cap</Trans>} value={formatSat(idCoid.marketCap)} prefix={<img style={{ width: 16, height: 16 }} src={btcIcon}></img>} />
                    </Col>
                    <Col xs={12} sm={12} md={6} lg={6} xl={6} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Statistic valueStyle={{ display: 'flex', alignItems: 'center', fontSize: 16 }} title={<Trans>Floor Price</Trans>} formatter={() => <NumberFormat value={idCoid.floorPrice} isBig decimal={8} tiny suffix=' BTC' precision={12} />} />
                    </Col>
                    <Col xs={12} sm={12} md={6} lg={6} xl={6} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Statistic valueStyle={{ display: 'flex', alignItems: 'center', fontSize: 16 }} title={<Space size={4} style={{ cursor: 'pointer' }} onClick={() => { history.push('/holders/' + idCoid.tick) }}>{<Trans>Holders</Trans>} <RightOutlined style={{ fontSize: 10 }} /></Space>} value={idCoid.holders} />
                    </Col>
                </Row>
            </Card>
        </Col>
        <Col md={12} xs={24} >
            <DescItem label={<Trans>Ticker</Trans>} value={idCoid.tick} />
        </Col>
        <Col md={12} xs={24} >
            <DescItem label={<Trans>Followers Limit</Trans>} value={<NumberFormat value={idCoid.followersLimit} />} />
        </Col>
        <Col md={12} xs={24} >
            <DescItem label={<Trans>Amount Per Mint</Trans>} value={<NumberFormat value={idCoid.amtPerMint} />} />
        </Col>
        <Col md={12} xs={24} >
            <DescItem label={<Trans>Liquidity Per Mint</Trans>} value={<NumberFormat value={idCoid.liquidityPerMint} isBig decimal={8} suffix=' BTC' />} />
        </Col>
        <Col span={24} >

            <div style={{ padding: '20px 23px', background: 'rgba(25, 27, 24, 0.84)', borderRadius: 8 }}>
                <div style={{ fontSize: '16px', color: '#fff' }}>{<Trans>Message</Trans>}</div>
                <div style={{ fontSize: '16px', lineHeight: 1.2, marginTop: 16 }}><IDCoinAllMessage info={idCoid.metaData} /></div>
            </div>

        </Col>
        <Col span={24} >
            <Button
                block
                className="submit"
                size="large"
                type="primary"
                onClick={() => { history.push(`/idCoin/${idCoid.tick}`) }}
                style={{ height: 48 }}
                icon={<ArrowRightOutlined style={{  transform: 'rotate(-0.125turn)' }}/>}
                iconPosition='end'
            >
               <Trans>View Details Page</Trans> 
            </Button></Col>
    </Row >
}