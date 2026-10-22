import Order from "@/components/Order";
import { sellOrder } from "@/services/api";
import { Button, Card, ConfigProvider, InputNumber, List, Space, Grid } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useModel } from "umi";
import "./index.less";
import level from "@/assets/level.svg";
import {
  ArrowLeftOutlined,
  CheckOutlined,
  LeftOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { formatSat } from "@/utils/utlis";
import SuccessModal, {
  DefaultSuccessProps,
  SuccessProps,
} from "@/components/SuccessModal";
import JSONView from "@/components/JSONView";
import ListForMRC20 from "@/components/ListForMRC20";
import NumberFormat from "@/components/NumberFormat";
import ListForPin from "./components/ListForPin";
import Trans from "@/components/Trans";
const { useBreakpoint } = Grid;
const items: Array<"PIN" | "MRC-20" | "ID-Coins"> = ["PIN", "MRC-20", "ID-Coins"];
export default () => {
  const [tab, setTab] = useState<"PIN" | "MRC-20" | 'ID-Coins'>("PIN");
  const screens = useBreakpoint();
  return (
    <div className="salePage animation-slide-bottom">
      <div
        className="title"
        onClick={() => {
          history.back();
        }}
      >
        <LeftOutlined /> <Trans>List For Sale</Trans>
      </div>
      <div className="saleContent">
        <div className="tabs">
          <Space>
            {items.map((item) => (
              <Button
                key={item}
                type={tab === item ? "link" : "text"}
                onClick={() => setTab(item)}
                size={screens.md ? "large" : "small"}
              >
                <Trans>{item}</Trans>
              </Button>
            ))}
          </Space>
        </div>
        {
          tab === "PIN" && <ListForPin />

        }
        {tab === "MRC-20" && <ListForMRC20 tag="MRC-20" />}
        {tab === "ID-Coins" && <ListForMRC20 tag="ID-Coins" />}
      </div>



    </div>
  );
};
