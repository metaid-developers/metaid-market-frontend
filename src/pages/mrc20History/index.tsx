import { ArrowLeftOutlined, LeftOutlined } from "@ant-design/icons";
import { Button, Space, Table, TableProps, Tooltip, message } from "antd";

import "./index.less";
import { useEffect, useState } from "react";
import Deploy from "./components/Deploy";
import Mint from "./components/Mint";
import Transfer from "./components/Transfer";
import { useSearchParams } from "umi";
import Trans from "@/components/Trans";
type Tab = "Deploy" | "Mint";
const items: Tab[] = ["Deploy", "Mint"];
export default () => {
    const [query] = useSearchParams();
    const _tab = query.get("tab");
    useEffect(() => {
        if (_tab && items.includes(_tab as Tab)) {
            setTab(_tab as Tab)
        }
    }, [_tab])
    const [tab, setTab] = useState<Tab>("Deploy");

    return (
        <div className="deployHistoryPage animation-slide-bottom">
            <div
                className="title"
                onClick={() => {
                    history.back();
                }}
            >
                <LeftOutlined /> <Trans>User</Trans> /<span className="subTitle"><Trans>My MRC-20</Trans></span>
            </div>

            <div className="tabs">
                <Space>
                    {items.map((item) => (
                        <Button
                            key={item}
                            type={tab === item ? "link" : "text"}
                            onClick={() => setTab(item)}
                            size="large"
                        >
                            <Trans>{item}</Trans>
                        </Button>
                    ))}
                </Space>
            </div>
            <div>
                {tab === 'Deploy' && <Deploy />}
                 {tab === 'Mint' && <Mint />}

            </div>

        </div>
    );
};
