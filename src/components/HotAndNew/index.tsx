import { useState } from "react";
import { ConfigProvider, Tabs } from "antd";
import { useNavigate } from "umi";
import Trans from "../Trans";
import { FireFilled, SearchOutlined, ThunderboltFilled } from "@ant-design/icons";
import HOT from "./HOT";
import "./index.less";

export default () => {
    const nav = useNavigate();
    const [active, setActive] = useState("hot");

    const items = [
        {
            key: 'hot',
            label: <Trans>HOT</Trans>,
            children: <HOT type='hot' />,
            icon: <FireFilled />,
        },
        {
            key: 'new',
            label: <Trans>NEW</Trans>,
            children: <HOT type='new' />,
            icon: <ThunderboltFilled />,
        },
        {
            key: 'search',
            label: <Trans>Search</Trans>,
            icon: <SearchOutlined />,
            children: <span />,
        },
    ]
    return <ConfigProvider
        theme={{
            token: {
                colorBorderSecondary: 'transparent',
            },
            components: {
                Tabs: {
                    inkBarColor: 'transparent',
                },
            },
        }}
    >
        <Tabs
            activeKey={active}
            items={items}
            className="hot-and-new-tabs"
            style={{ marginBottom: 20 }}
            onChange={(key) => {
                if (key === "search") {
                    nav("/search");
                    return;
                }
                setActive(key);
            }}
        />
    </ConfigProvider>
}