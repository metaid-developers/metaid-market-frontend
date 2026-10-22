import NumberFormat from "@/components/NumberFormat";
import { LeftOutlined } from "@ant-design/icons";
import { Descriptions } from "antd"
import "./index.less";
import Trans from "@/components/Trans";

export default () => {
    return <div className="AboutFeesPage animation-slide-bottom">
        <div
            className="backTitle"
            onClick={() => {
                history.back();
            }}
        >
            <LeftOutlined /> <Trans>About Fees</Trans>
        </div>
        <div style={{ fontSize: 18, fontWeight: 'bold', margin: '28px' }}><Trans>Metaid.Market Fee</Trans></div>
        <Descriptions style={{
            border: '1px solid #D4F66B',
            borderRadius: 16,
            overflow: 'hidden',
            width: 994,
            maxWidth: 'calc(100vw - 40px)',
        }} bordered title={<Trans>Service Fee</Trans>} column={1} items={[
            {
                key: '2',
                label: <Trans>Deploy MRC-20</Trans>,
                children: <div><NumberFormat value={1999} isBig decimal={8} suffix=' BTC' /></div>
            },
            {
                key: '5',
                label: <Trans>Follow</Trans>,
                children: <div><NumberFormat value={0} isBig decimal={8} suffix=' BTC' /></div>
            },
            {
                key: '6',
                label: <Trans>Mint MRC-20</Trans>,
                children: <div><NumberFormat value={0} isBig decimal={8} suffix=' BTC' /></div>
            },
            {
                key: '7',
                label: <Trans>List MRC-20</Trans>,
                children: <div><NumberFormat value={0} isBig decimal={8} suffix=' BTC' /></div>
            },
            {
                key: '8',
                label: <Trans>Inscribe File/Pin/Buzz</Trans>,
                children: <div><NumberFormat value={0} isBig decimal={8} suffix=' BTC' /></div>
            },
            {
                key: '8',
                label: <Trans>Buy MRC-20/Pin/ID-Coins</Trans>,
                children: <div><Trans>No service fee is charged for transactions less than 300,000 satoshis. For transactions equal to or greater than 300,000 satoshis, a 0.6% service fee is charged, collected from the buyer.</Trans></div>
            },
            {
                key: '8',
                label: <Trans>Transfer MRC-20</Trans>,
                children: <div><NumberFormat value={0} isBig decimal={8} suffix=' BTC' /></div>
            },
            {
                key: '8',
                label: <Trans>Redeem</Trans>,
                children: <div><NumberFormat value={0} isBig decimal={8} suffix=' BTC' /></div>
            },
            {
                key: '8',
                label: <Trans>Refund</Trans>,
                children: <div><NumberFormat value={0} isBig decimal={8} suffix=' BTC' /></div>
            },
            {
                key: '8',
                label:<Trans>Set Profile</Trans> ,
                children: <div><NumberFormat value={0} isBig decimal={8} suffix=' BTC' /></div>
            },
        ]} />
    </div>
}