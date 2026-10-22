import MetaIdAvatar from "@/components/MetaIdAvatar";
import Popup from "@/components/ResponPopup"
import { useModel, useSearchParams, history } from "umi";
import './comfirmMintIdCoin.less'
import { Alert, Button, Col, Collapse, Divider, Row, Space, Tooltip } from "antd";
import NumberFormat from "@/components/NumberFormat";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { useMemo } from "react";
import Trans from "@/components/Trans";
type Props = {
    show: boolean
    onClose: () => void;
    idCoin: API.IdCoin | undefined
    order: API.MintIdCoinPreRes & { _gasFee: number, errMsg?: string } | undefined
    submiting?: boolean
    handleSubmit: () => Promise<void>
}
const DescItem = ({ label, value, dark, style = {}, error }: { label: React.ReactNode, dark?: boolean, error?: boolean, value: React.ReactNode, style?: React.CSSProperties }) => {
    console.log('DescItem', error)
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 0', ...style }}>
        <div style={{ fontSize: '16px', color: error ? 'rgb(255,82,82)' : dark ? 'rgba(255, 255, 255, 0.5)' : '#fff', }}><Trans>{label}</Trans></div>
        <div style={{ fontSize: '16px' }}>{value}</div>
    </div>
}
export default ({ show, onClose, idCoin, order, submiting, handleSubmit }: Props) => {
    const { userBal, avatar, userName, metaid } =
        useModel("wallet");

    const errTip = useMemo(() => {
        if (!order) return ''
        if ((order.totalFee - order.revealInscribeOutValue - order.revealMintOutValue) >= Number(userBal) * 1e8) {
            console.log('Insufficient Balance', (order.totalFee - order.revealInscribeOutValue - order.revealMintOutValue), userBal)
            return 'Insufficient Balance'
        }
       
        if (order.errMsg) {
            return order.errMsg === 'Insufficient Balance' ? "You don't have enough balance to build the Commit transaction." : 'Failed to mint'
        }
    }, [order, userBal])

    if (!order || !idCoin) return <></>
    const items = [
        {
            key: 1,
            label: <DescItem dark style={{ padding: 0 }} label={<Space> Gas <Tooltip title={<Trans>Gas = Commit Gas + Reveal Gas</Trans>}> <QuestionCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} /></Tooltip></Space>} value={order._gasFee === 0 ? '--' : <NumberFormat value={order._gasFee + order.revealInscribeGas + order.revealMintGas} isBig decimal={8} minDig={8} suffix=' BTC' />} />,
            children: <div>
                <DescItem dark error={order._gasFee === 0} label="Commit Gas" value={<>{order._gasFee === 0 ? '--' : <NumberFormat value={order._gasFee} isBig decimal={8} minDig={8} suffix=' BTC' />}</>} />
                <DescItem dark label="Reveal Inscribe Gas" value={<NumberFormat value={order.revealInscribeGas} isBig decimal={8} minDig={8} suffix=' BTC' />} />
                <DescItem dark label="Reveal Mint Gas" value={<NumberFormat value={order.revealMintGas} isBig decimal={8} minDig={8} suffix=' BTC' />} />
            </div>
        },
        // {
        //     key: 2,
        //     label: <DescItem dark style={{ padding: 0 }} label={<Space>Reveal Out Value </Space>} value={<NumberFormat value={ order.revealInscribeOutValue + order.revealMintOutValue} isBig decimal={8} minDig={8} suffix=' BTC' />} />,
        //     children: <div>
        //         <DescItem dark label="Reveal Inscribe Out Value" value={<NumberFormat value={order.revealInscribeOutValue} isBig decimal={8} minDig={8} suffix=' BTC' />} />
        //         <DescItem dark label="Reveal Mint Out Value" value={<NumberFormat value={order.revealMintOutValue} isBig decimal={8} minDig={8} suffix=' BTC' />} />
        //     </div>
        // },
    ]
    return <Popup
        title={<Trans>{idCoin.isFollowing ? 'Mint' : 'Follow And Mint'}</Trans>}
        modalWidth={452}
        show={show}
        onClose={onClose}
        closable={true}
        bodyStyle={{ padding: "28px 25px" }}
        className="mintModal">

        <div className="mintContent">
            <div className="users">
                <div className='userAvatar'>
                    <MetaIdAvatar avatar={idCoin.deployerUserInfo.avatar} size={60} />
                </div>

                <div className="name">{idCoin.deployerUserInfo.name || 'Unnamed'}</div>
                <div className="metaid">Metaid:{idCoin.deployerMetaId ? idCoin.deployerMetaId.replace(/(\w{6})\w+(\w{3})/, "$1...") : '--'}</div>
            </div>
            <Divider style={{ margin: '12px 0' }} />
            <DescItem label="Ticker" value={<span style={{ color: '#F68819', fontWeight: 'bold' }}>{idCoin.tick}</span>} />
            <DescItem label="Followers Limit" value={<NumberFormat value={idCoin.followersLimit} />} />
            <DescItem label="Amount Per Mint" value={<NumberFormat value={idCoin.amtPerMint} />} />
            <DescItem label="Total Supply" value={<NumberFormat value={idCoin.totalSupply} />} />
            <DescItem label="Pool" value={<NumberFormat value={idCoin.pool} decimal={8} isBig suffix=' BTC' />} />
            <Divider style={{ margin: '2px 0' }} />

            <Collapse ghost items={items} style={{ width: '100%' }} defaultActiveKey={order._gasFee === 0 ? 1 : ''} />
            {/* <DescItem label={<Space> Gas <Tooltip title="Gas = Commit Gas + Reveal Gas"> <QuestionCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} /></Tooltip></Space>} value={<></>} />
            <DescItem dark label="Commit Gas" value={<NumberFormat value={order._gasFee} isBig decimal={8} minDig={8} suffix=' BTC' />} />
            <DescItem dark label="Reveal Inscribe Gas" value={<NumberFormat value={order.revealInscribeGas} isBig decimal={8} minDig={8} suffix=' BTC' />} />
            <DescItem dark label="Reveal Mint Gas" value={<NumberFormat value={order.revealMintGas} isBig decimal={8} minDig={8} suffix=' BTC' />} /> */}
            {/* <DescItem dark label="Reveal Inscribe Out Value" value={<NumberFormat value={order.revealInscribeOutValue} isBig decimal={8} minDig={8} suffix=' BTC' />} />
            <DescItem dark label="Reveal Mint Out Value" value={<NumberFormat value={order.revealMintOutValue} isBig decimal={8} minDig={8} suffix=' BTC' />} /> */}


            <DescItem dark label="Service Fee" value={<NumberFormat value={order.serviceFee} isBig decimal={8} minDig={8} suffix=' BTC' />} />
            <DescItem dark label="Liquidity Required" value={<NumberFormat value={idCoin.liquidityPerMint} isBig decimal={8} minDig={8} suffix=' BTC' />} />
            <Divider style={{ margin: '2px 0' }} />
            <DescItem label="You Will Spend" value={errTip ? '--' : <NumberFormat value={order.totalFee + order._gasFee - order.revealInscribeOutValue - order.revealMintOutValue} isBig decimal={8} minDig={8} suffix=' BTC' />} />
            <DescItem label="Available Balance" value={<NumberFormat value={userBal} minDig={8} suffix=' BTC' />} />
            {errTip && (

                <Alert
                    message={<Trans>{errTip}</Trans>}
                    type="error"
                    showIcon
                    style={{ width: '100%' }}
                />

            )}
            <Row gutter={[24, 24]} style={{ marginTop: 24, width: '80%' }}>
                <Col span={12}>
                    <Button size='large' type="link" block onClick={onClose}><Trans>Cancel</Trans></Button>
                </Col>
                <Col span={12}>
                    <Button size='large' type='primary' disabled={!!order.errMsg} loading={submiting} block onClick={handleSubmit}><Trans>Confirm</Trans></Button>
                </Col>
            </Row>
        </div>

    </Popup>
}