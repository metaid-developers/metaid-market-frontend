import MetaIdAvatar from "@/components/MetaIdAvatar";
import Popup from "@/components/ResponPopup"
import { useModel, useSearchParams, history } from "umi";
import './index.less'
import { Button, Col, Collapse, Divider, Row, Space, Tooltip } from "antd";
import NumberFormat from "@/components/NumberFormat";
import { QuestionCircleOutlined } from "@ant-design/icons";
import Trans from "@/components/Trans";
type Props = {
    show: boolean
    onClose: () => void;
    fields?: Partial<{
        tick: string,
        followersNum: number,
        amountPerMint: number,
        liquidityPerMint: number,
        gasFee: number
    }>
    order: API.DeployIdCoinPreRes | undefined
    submiting?: boolean
    handleSubmit: () => Promise<void>
}
const DescItem = ({ label, value, dark, style = {} }: { label: React.ReactNode, dark?: boolean, value: React.ReactNode, style?: React.CSSProperties }) => {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 0', ...style }}>
        <div style={{ fontSize: '16px', color: dark ? 'rgba(255, 255, 255, 0.5)' : '#fff' }}>{label}</div>
        <div style={{ fontSize: '16px' }}>{value}</div>
    </div>
}
export default ({ show, onClose, fields = {}, order, submiting, handleSubmit }: Props) => {
    const { userBal, avatar, userName, metaid } =
        useModel("wallet");
    const { tick = '', followersNum = 0, amountPerMint = 0, liquidityPerMint = 0 } = fields
    if (!order) return <></>
    const items = [
        {
            key: 1,
            label: <DescItem dark style={{ padding: 0 }} label={<Space> Gas <Tooltip title={<Trans>Gas = Commit Gas + Reveal Gas</Trans>}> <QuestionCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} /></Tooltip></Space>} value={<NumberFormat value={Number(fields.gasFee) + Number(order.minerGas)} isBig decimal={8} suffix=' BTC' minDig={8} />} />,
            children: <div>
                <DescItem dark label={<Trans>Commit Gas</Trans>} value={<NumberFormat value={fields.gasFee} isBig decimal={8} minDig={8} suffix=' BTC' />} />
                <DescItem dark label={<Trans>Reveal Gas</Trans>} value={<NumberFormat value={Number(order.minerGas)} isBig decimal={8} minDig={8} suffix=' BTC' />} />

            </div>
        },

    ]
    return <Popup
        title={<Trans>Launch Me</Trans>}
        modalWidth={452}
        show={show}
        onClose={onClose}
        closable={true}
        bodyStyle={{ padding: "28px 25px" }}
        className="launchModal">

        <div className="launchContent">
            <div className="users">
                <div className='userAvatar'>
                    <MetaIdAvatar avatar={avatar} size={60} />
                </div>

                <div className="name">{userName || 'Unnamed'}</div>
                <div className="metaid">Metaid:{metaid ? metaid.replace(/(\w{6})\w+(\w{3})/, "$1...") : '--'}</div>
            </div>
            <Divider />
            <DescItem label={<Trans>Ticker</Trans>} value={<span style={{ color: '#F68819', fontWeight: 'bold' }}>{tick}</span>} />
            <DescItem label={<Trans>Followers Limit</Trans>} value={<NumberFormat value={followersNum} />} />
            <DescItem label={<Trans>Amount Per Mint</Trans>} value={<NumberFormat value={amountPerMint} />} />
            <DescItem label={<Trans>Liquidity Per Mint</Trans>} value={<NumberFormat value={liquidityPerMint} suffix=' BTC' />} />
            <Divider style={{ margin: '2px 0' }} />

            {/* <DescItem dark label="Gas" value={<NumberFormat value={Number(fields.gasFee) + Number(order.minerGas)} isBig decimal={8} suffix=' BTC' minDig={8} />} /> */}
            <Collapse ghost items={items} style={{ width: '100%' }} />
            {/* <DescItem dark label="Miner Out Value" value={<NumberFormat value={order.minerOutValue} isBig decimal={8} minDig={8} suffix=' BTC' />} /> */}
            <DescItem dark label={<Trans>Service Fee</Trans>} value={<NumberFormat value={order.serviceFee} isBig decimal={8} suffix=' BTC' minDig={8} />} />
            <Divider style={{ margin: '2px 0' }} />
            <DescItem label={<Trans>You Will Spend</Trans>} value={<NumberFormat value={Number(order.totalFee) + Number(fields.gasFee) - order.minerOutValue} isBig decimal={8} minDig={8} suffix=' BTC' />} />
            <DescItem label={<Trans>Available Balance</Trans>} value={<NumberFormat value={userBal} suffix=' BTC' minDig={8} />} />
            <Row justify="center" gutter={[24, 24]} style={{ marginTop: 24, width: '80%' }}>
                <Col span={12}>
                    <Button size='large' type="link" block onClick={onClose}>{<Trans>Cancel</Trans>}</Button>
                </Col>
                <Col span={12}>
                    <Button size='large' type='primary' loading={submiting} block onClick={handleSubmit}>{<Trans>Confirm</Trans>}</Button>
                </Col>
            </Row>
        </div>

    </Popup>
}