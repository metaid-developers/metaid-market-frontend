import MRC20Icon from "@/components/MRC20Icon"
import MetaIdAvatar from "@/components/MetaIdAvatar"
import NumberFormat from "@/components/NumberFormat"
import Trans from "@/components/Trans"
import { QuestionCircleOutlined } from "@ant-design/icons"
import { Alert, Card, Descriptions, Tooltip, Typography } from "antd"
const { Title, Paragraph, Text, Link } = Typography;
type Props = {
    mintMrc20Info: API.MRC20TickInfo
}
export default ({ mintMrc20Info }: Props) => {
   
    return <Card bordered={false} style={{ marginBottom: 20 }} className="mrc20CardInfo">
        <div className="tokenInfo">
            <MRC20Icon size={80} tick={mintMrc20Info.tick} metadata={mintMrc20Info.metaData} />
            <div className="tickName">
                <span>{mintMrc20Info.tick}</span> {mintMrc20Info.tokenName && <span>({mintMrc20Info.tokenName}) </span>}
                {/* <Tooltip title="Token">
                    <QuestionCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                </Tooltip> */}
            </div>
            <div className="tokenId">
                <Typography.Text className="token" copyable={{ text: mintMrc20Info.mrc20Id, }}>Token ID: {mintMrc20Info.mrc20Id.replace(/(\w{4})\w+(\w{5})/, "$1...$2")}</Typography.Text>
            </div>
        </div>
        <Descriptions column={1}
            labelStyle={{ color: '#FFFFFF', display: 'flex', alignItems: 'center' }}
            contentStyle={{ flexGrow: 1, justifyContent: 'flex-end', color: 'rgba(255, 255, 255, 0.5)' }}
            items={[
                {
                    key: 'Deployer',
                    label: <Trans>Deployer</Trans>,
                    children: <div className="deployer">
                        <div className="deployerInfo">
                            <MetaIdAvatar size={20} avatar={mintMrc20Info.deployerUserInfo?.avatar || ""} /><div className="deployerName">{mintMrc20Info.deployerUserInfo?.name || mintMrc20Info.deployerAddress.replace(/(\w{5})\w+(\w{3})/, "$1...$2")}</div>
                        </div>
                        <div className="MetaId">
                            MetaID:{mintMrc20Info.deployerMetaId.replace(/(\w{6})\w+(\w{5})/, "$1...")}
                        </div>
                    </div>
                },

                {
                    key: 'mintCount',
                    label: <Trans>Mint Limit</Trans>,
                    children: <> <NumberFormat value={mintMrc20Info.mintCount} /></>
                },
                {
                    key: 'amtPerMint',
                    label: <Trans>Amount Per Mint</Trans>,
                    children: <> <NumberFormat value={mintMrc20Info.amtPerMint} /></>
                },
                {
                    key: 'mc',
                    label: <span><Trans>Market Cap</Trans> <Tooltip title={<p><Trans>Market Capitalization = Current Price x Circulating Supply</Trans> <br></br> <Trans>The total market value of the cryptocurrency's circulating supply.</Trans></p>}> <QuestionCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} /></Tooltip> </span>,
                    children: <NumberFormat value={mintMrc20Info.marketCap} isBig decimal={8} suffix=' BTC' />
                },
                {
                    key: 'totalSupply',
                    label: <span><Trans>Total Supply</Trans> <Tooltip title={<p><Trans>The total amount of tokens that have been created, minus any tokens that have been burned (taken out of circulation).</Trans><br /><Trans>Total Supply = In-Chain Supply - Burned Tokens.</Trans></p>}> <QuestionCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} /></Tooltip> </span>,
                    children: <NumberFormat value={mintMrc20Info.totalSupply} />
                },
                {
                    key: 'Decimals',
                    label: <Trans>Decimals</Trans>,
                    children: <>{mintMrc20Info.decimals}</>
                },
                {
                    key: 'PremineCount',
                    label: <Trans>Premine Count</Trans>,
                    children: <>{Number(mintMrc20Info.premineCount) === 0 ? <Trans>Fair Launch</Trans> : <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 'bold', color: "rgb(255, 82, 82)" }}>
                            <NumberFormat value={mintMrc20Info.premineCount} />

                        </div>
                        <div style={{ fontSize: 12 }}> <NumberFormat value={Number(mintMrc20Info.premineCount) * Number(mintMrc20Info.amtPerMint)} suffix={` ${mintMrc20Info.tick} have been preminted`} /></div>
                    </div>}</>
                },
                {
                    key: 'Path',
                    label: <Trans>Path</Trans>,
                    children: <Tooltip title={mintMrc20Info.pinCheck.path}>{mintMrc20Info.pinCheck.path.replace(/(.{6}).+(.{5})/, "$1...$2")}</Tooltip>
                },
                {
                    key: 'Difficultylevel',
                    label: <Trans>Difficulty Level</Trans>,
                    children: <>{mintMrc20Info.pinCheck.lvl || '--'}</>
                },
                {
                    key: 'Count',
                    label: <Trans>Count</Trans>,
                    children: <>{mintMrc20Info.pinCheck.count || '--'}</>
                },
                {
                    key: 'beginHeight',
                    label: <Trans>Begin Height</Trans>,
                    children: <>{mintMrc20Info.beginHeight || '--'}</>
                },
                {
                    key: 'endHeight',
                    label: <Trans>End Height</Trans>,
                    children: <>{mintMrc20Info.endHeight || '--'}</>
                }
            ]}></Descriptions>
        {
            (mintMrc20Info.payCheck && mintMrc20Info.payCheck.payTo) && <Alert
                message={<Trans>Important Notice</Trans>}
                description={
                    <Typography style={{ textAlign: 'left',fontSize:12 }}>
                        <Paragraph>
                            <Trans>According to the deployment file, when you mint the Token, a certain amount of BTC will be transferred to a specified address.</Trans>
                        </Paragraph>
                        <Paragraph>
                            <Trans>Before proceeding, please ensure that:</Trans>
                        </Paragraph>
                        <Paragraph>
                            <ol style={{fontSize:12}}>
                                <li >
                                    <Text style={{fontSize:12}}><Trans>You have fully understood and confirmed the Token details and the destination address.</Trans></Text>
                                </li>
                                <li>
                                    <Text style={{fontSize:12}}><Trans>You are aware of and accept the potential risks, such as misuse or malicious activities.</Trans></Text>
                                </li>

                            </ol>
                        </Paragraph>
                        <Paragraph>
                            <Trans>You will:</Trans>
                        </Paragraph>
                        <Paragraph>
                            <ul >
                                <li>
                                    <Text style={{fontSize:12}}><Trans>Pay To Address:</Trans>{mintMrc20Info.payCheck.payTo}</Text>
                                </li>
                                <li>
                                    <Text  style={{fontSize:12}}><Trans>Pay Amount:</Trans> <NumberFormat value={mintMrc20Info.payCheck.payAmount} isBig decimal={8} suffix=' BTC' /></Text>
                                </li>

                            </ul>
                        </Paragraph>
                    </Typography>
                }
                type="error"
            />
        }
    </Card>
}

