import { Dropdown, Menu, MenuProps, Space } from "antd";
import { history, useLocation } from "umi";
import { HomeOutlined, EditOutlined, DownOutlined, MenuOutlined } from "@ant-design/icons";
import { useMemo, useState } from "react";
import home1 from "@/assets/home1.svg";
import home2 from "@/assets/home2.svg";
import inscribe1 from "@/assets/Inscribe1.svg";
import inscribe2 from "@/assets/Inscribe2.svg";
import launch from "@/assets/launch.svg";
import Trans from "@/components/Trans";
type MenuItem = Required<MenuProps>["items"][number];

const items = [
  {
    label: "Market",
    key: "/",
    icon: home2,
    activeIvon: home1,
  },
  {
    label: "Inscribe",
    key: "/inscribe",
    icon: inscribe1,
    activeIvon: inscribe2,
  },
  {
    label: "Launch Me",
    key: "/launch",
    className: 'Launch',
    icon: launch,
    activeIvon: launch,
  },
];
export default () => {
  const location = useLocation();
  const path = location.pathname;
  const onClick = (key: string) => {
    history.push(key);
  };
  return (<>
    <Space className="navs">
      {items.map((item) => (
        <div
          onClick={() => onClick(item.key)}
          className={`nav ${item.className} ${path === item.key ? "active" : ""}`}
          key={item.key}
        >
          <img
            className="icon"
            src={path === item.key ? item.activeIvon : item.icon}
            alt=""
          />{" "}
          <span className="text"><Trans>{item.label}</Trans></span>
        </div>
      ))}
    </Space>
    <Dropdown className="DropdownMenu" menu={{
      items: items.map(item => {
        return {
          key: item.key,
          label: <div
            onClick={() => onClick(item.key)}
            className={`nav ${item.className} ${path === item.key ? "active" : ""}`}
            key={item.key}
          >
            <img
              className="icon"
              src={path === item.key ? item.activeIvon : item.icon}
              alt=""
            />{" "}
            <span className="text">{item.label}</span>
          </div>
        }
      })
    }}>
      <a onClick={(e) => e.preventDefault()}>
        <Space>

          <MenuOutlined />
        </Space>
      </a>
    </Dropdown></>
  );
};
