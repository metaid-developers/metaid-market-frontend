import MRC20Icon from "@/components/MRC20Icon";
import MetaIdAvatar from "@/components/MetaIdAvatar";
import NumberFormat from "@/components/NumberFormat";
import Trans from "@/components/Trans";
import {
  getAddressMrc721Collections,
  getAddressMrc721Items,
  getMrc20Info,
  getUserMrc20List,
  type Mrc721Envelope,
} from "@/services/api";
import { formatSat } from "@/utils/utlis";
import {
  Button,
  Input,
  Modal,
  Pagination,
  Spin,
  Table,
  Typography,
} from "antd";
import type { TableColumnsType } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { history, useIntl, useModel, useSearchParams } from "umi";
import "./index.less";

const MRC20_SIZE = 10;
const NFT_SIZE = 12;

const BASE58 = /^[123mn][1-9A-HJ-NP-Za-km-z]{24,61}$/;
const BECH32 = /^(bc1|tb1|bcrt1)[ac-hj-np-z02-9]{11,87}$/;

function normalizeSearchAddress(raw: string) {
  return raw.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
}

function isChainAddress(raw: string) {
  const value = normalizeSearchAddress(raw);
  if (!value) return false;
  if (BECH32.test(value.toLowerCase())) return true;
  return BASE58.test(value);
}

function contentUrl(raw: string | undefined, network: API.Network) {
  if (!raw) return "";
  const text = raw.trim();
  if (!text) return "";
  if (/^https?:\/\//i.test(text)) return text;
  const host =
    network === "testnet"
      ? "https://man-test.metaid.io/content/"
      : "https://man.metaid.io/content/";
  const id = text
    .replace(/^metafile:\/\//, "")
    .replace(/^\/content\//, "")
    .replace(/(i\d+)\.[a-z0-9]+$/i, "$1");
  return host + id;
}

function readPage<T>(
  res: Mrc721Envelope<{ list?: T[]; total?: number } | T[] | null>
) {
  if (res.code === 100) return { list: [] as T[], total: 0 };
  if (res.code !== 1) throw new Error(res.message || "error");
  const data = res.data;
  if (!data || Array.isArray(data)) return { list: [] as T[], total: 0 };
  return { list: data.list || [], total: data.total || 0 };
}

function albumTitle(col?: API.Mrc721CollectionHold | null, fallback?: string) {
  return col?.name || col?.collectionName || fallback || "";
}

function PinCover({
  src,
  alt,
  className,
  fallbackClass,
}: {
  src: string;
  alt: string;
  className: string;
  fallbackClass: string;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [src]);
  if (!src || failed) {
    return (
      <span className={fallbackClass}>{(alt || "?").slice(0, 1).toUpperCase()}</span>
    );
  }
  return (
    <img
      className={className}
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
    />
  );
}

function TokenFace({ row }: { row: API.UserMrc20Asset }) {
  const info = row.tickInfo;
  const isId = info?.tag === "id-coins";
  return (
    <div className="tokenCell">
      {isId ? (
        <MetaIdAvatar size={40} avatar={info?.deployerUserInfo?.avatar || ""} />
      ) : (
        <MRC20Icon tick={row.tick} metadata={info?.metaData || ""} />
      )}
      <div className="tokenText">
        <div className={isId ? "tickName id" : "tickName"}>
          {row.tick}
          {isId ? <span className="tag">ID-Coins</span> : null}
        </div>
        <div className="tokenSub">
          {row.tokenName || info?.tokenName || info?.deployerUserInfo?.name || row.mrc20Id.slice(0, 8)}
        </div>
      </div>
    </div>
  );
}

function PriceCell({ info }: { info?: API.MRC20TickInfo }) {
  if (!info?.price || Number(info.price) === 0) return <>—</>;
  const down = info.change24h?.startsWith("-");
  return (
    <span className="priceCell">
      {formatSat(info.price)} BTC
      {info.change24h ? (
        <span className={down ? "down" : "up"}>{info.change24h}</span>
      ) : null}
    </span>
  );
}

export default function AddressSearch() {
  const intl = useIntl();
  const { network, btcAddress, connected } = useModel("wallet");
  const [params] = useSearchParams();
  const address = normalizeSearchAddress(params.get("address") || "");
  const valid = isChainAddress(address);

  const [input, setInput] = useState(address);
  const [formError, setFormError] = useState("");
  const [paging, setPaging] = useState({ address: "", mrc: 0, nft: 0, album: "" });
  const [mrcReload, setMrcReload] = useState(0);
  const [nftReload, setNftReload] = useState(0);

  const [mrcLoading, setMrcLoading] = useState(false);
  const [mrcError, setMrcError] = useState("");
  const [mrcState, setMrcState] = useState<{
    address: string;
    list: API.UserMrc20Asset[];
    total: number;
  }>({ address: "", list: [], total: 0 });

  const [nftLoading, setNftLoading] = useState(false);
  const [nftError, setNftError] = useState("");
  const [nftState, setNftState] = useState<{
    address: string;
    album: string;
    list: API.Mrc721Item[];
    total: number;
  }>({ address: "", album: "", list: [], total: 0 });
  const [albumState, setAlbumState] = useState<{
    address: string;
    list: API.Mrc721CollectionHold[];
  }>({ address: "", list: [] });
  const [openItem, setOpenItem] = useState<API.Mrc721Item | null>(null);

  const infoCache = useRef(new Map<string, API.MRC20TickInfo | null>());
  const cacheKey = useRef("");

  const mrcPage = paging.address === address ? paging.mrc : 0;
  const nftPage = paging.address === address ? paging.nft : 0;
  const album = paging.address === address ? paging.album : "";

  const mrcList = mrcState.address === address ? mrcState.list : [];
  const mrcTotal = mrcState.address === address ? mrcState.total : null;
  const nftList =
    nftState.address === address && nftState.album === album ? nftState.list : [];
  const nftTotal =
    nftState.address === address && nftState.album === album ? nftState.total : null;
  const albums = albumState.address === address ? albumState.list : [];

  useEffect(() => {
    setInput(address);
    setOpenItem(null);
    if (address && !isChainAddress(address)) {
      setFormError(
        "Enter a valid chain address. MetaID and tickers are not supported yet."
      );
    } else if (address) {
      setFormError("");
    }
  }, [address]);

  useEffect(() => {
    if (!valid) return;
    let cancelled = false;
    const key = `${network}:${address}:${mrcReload}`;
    if (cacheKey.current !== key) {
      infoCache.current.clear();
      cacheKey.current = key;
    }
    (async () => {
      setMrcLoading(true);
      setMrcError("");
      try {
        const res = await getUserMrc20List(network, {
          address,
          cursor: mrcPage * MRC20_SIZE,
          size: MRC20_SIZE,
        });
        if (cancelled) return;
        if (res.code !== 0) {
          const message = "message" in res ? String(res.message || "") : "";
          if (/no data/i.test(message)) {
            setMrcState({ address, list: [], total: 0 });
            return;
          }
          throw new Error();
        }
        const rows = res.data?.list || [];
        const total = res.data?.total || 0;
        const enriched = await Promise.all(
          rows.map(async (row) => {
            const hit = infoCache.current.get(row.mrc20Id);
            if (hit !== undefined) return { ...row, tickInfo: hit || undefined };
            try {
              const info = await getMrc20Info(network, { tickId: row.mrc20Id });
              if (cancelled) return row;
              const data = info.code === 0 ? info.data : null;
              infoCache.current.set(row.mrc20Id, data);
              return { ...row, tickInfo: data || undefined };
            } catch {
              return row;
            }
          })
        );
        if (cancelled) return;
        setMrcState({ address, list: enriched, total });
      } catch {
        if (!cancelled) {
          setMrcError("Could not load MRC-20 holdings.");
          setMrcState({ address: "", list: [], total: 0 });
        }
      } finally {
        if (!cancelled) setMrcLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [valid, address, mrcPage, network, mrcReload]);

  useEffect(() => {
    if (!valid) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await getAddressMrc721Collections({
          address,
          cursor: 0,
          size: 100,
        });
        if (cancelled) return;
        const page = readPage<API.Mrc721CollectionHold>(res);
        setAlbumState({ address, list: page.list });
      } catch {
        if (!cancelled) setAlbumState({ address, list: [] });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [valid, address, nftReload]);

  useEffect(() => {
    if (!valid) return;
    let cancelled = false;
    (async () => {
      setNftLoading(true);
      setNftError("");
      try {
        const res = await getAddressMrc721Items({
          address,
          cursor: nftPage * NFT_SIZE,
          size: NFT_SIZE,
          ...(album ? { pinId: album } : {}),
        });
        if (cancelled) return;
        const page = readPage<API.Mrc721Item>(res);
        setNftState({ address, album, list: page.list, total: page.total });
      } catch {
        if (!cancelled) {
          setNftError("Could not load MRC-721 holdings.");
          setNftState({ address: "", album: "", list: [], total: 0 });
        }
      } finally {
        if (!cancelled) setNftLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [valid, address, nftPage, album, nftReload]);

  const patchPaging = (partial: Partial<typeof paging>) => {
    setPaging((prev) => {
      const base =
        prev.address === address
          ? prev
          : { address, mrc: 0, nft: 0, album: "" };
      return { ...base, ...partial, address };
    });
  };

  const submit = (raw?: string) => {
    const next = normalizeSearchAddress(raw ?? input);
    setInput(next);
    if (!next) {
      setFormError("Enter a BTC or MVC address");
      return;
    }
    if (!isChainAddress(next)) {
      setFormError(
        "Enter a valid chain address. MetaID and tickers are not supported yet."
      );
      return;
    }
    setFormError("");
    if (next === address) {
      setMrcReload((n) => n + 1);
      setNftReload((n) => n + 1);
      return;
    }
    history.replace(`/search?address=${encodeURIComponent(next)}`);
  };

  const openToken = (row: API.UserMrc20Asset) => {
    if (row.tickInfo?.tag === "id-coins") {
      history.push(`/idCoin/${encodeURIComponent(row.tick)}`);
      return;
    }
    history.push(`/mrc20/${row.mrc20Id}`);
  };

  const columns: TableColumnsType<API.UserMrc20Asset> = useMemo(
    () => [
      {
        title: <Trans>Token</Trans>,
        dataIndex: "tick",
        render: (_, row) => <TokenFace row={row} />,
      },
      {
        title: <Trans>Balance</Trans>,
        dataIndex: "balance",
        align: "right",
        render: (balance: string) => (
          <NumberFormat value={balance || 0} />
        ),
      },
      {
        title: <Trans>Price</Trans>,
        dataIndex: "tickInfo",
        align: "right",
        render: (info: API.MRC20TickInfo | undefined) => <PriceCell info={info} />,
      },
      {
        title: <Trans>Holders</Trans>,
        dataIndex: "tick",
        align: "right",
        width: 110,
        render: (tick: string, row) =>
          row.tickInfo ? (
            <span
              className="holdersLink"
              onClick={(event) => {
                event.stopPropagation();
                history.push(`/holders/${encodeURIComponent(tick)}`);
              }}
            >
              <NumberFormat value={row.tickInfo.holders || 0} />
            </span>
          ) : (
            "—"
          ),
      },
    ],
    []
  );

  const albumById = useMemo(() => {
    const map = new Map<string, API.Mrc721CollectionHold>();
    albums.forEach((item) => map.set(item.pinid, item));
    return map;
  }, [albums]);

  const nftHeld =
    albums.length > 0
      ? albums.reduce((sum, col) => sum + Number(col.ownnum || 0), 0)
      : nftTotal;

  const openAlbum = openItem
    ? albumById.get(openItem.collectionPinId)
    : undefined;
  const openCover = contentUrl(
    openItem?.cover || openAlbum?.cover,
    network
  );
  const openName =
    openItem?.name ||
    `${albumTitle(openAlbum, openItem?.collectionName)} #${openItem?.number ?? ""}`;

  return (
    <div className="addressSearch">
      <h1>
        <Trans>Address Search</Trans>
      </h1>
      <p className="lead">
        <Trans>Look up MRC-20 tokens and MRC-721 NFTs held by an address.</Trans>
      </p>

      <div className="searchPanel">
        <form
          className="searchForm"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <Input
            size="large"
            allowClear
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            value={input}
            status={formError ? "error" : undefined}
            placeholder={intl.formatMessage({
              id: "Enter a BTC or MVC address",
              defaultMessage: "Enter a BTC or MVC address",
            })}
            onChange={(event) => {
              setInput(event.target.value);
              if (formError) setFormError("");
            }}
          />
          <Button type="primary" size="large" htmlType="submit">
            <Trans>Start Search</Trans>
          </Button>
        </form>
        <p className="hint">
          <Trans>Only addresses can be searched right now.</Trans>
        </p>
        {formError ? (
          <p className="formError">
            <Trans>{formError}</Trans>
          </p>
        ) : null}
        {connected && btcAddress ? (
          <Button
            className="walletFill"
            type="link"
            onClick={() => submit(btcAddress)}
          >
            <Trans>Use wallet address</Trans>
          </Button>
        ) : null}
      </div>

      {!address ? (
        <div className="idle">
          <Trans>Search an address to see MRC-20 tokens and MRC-721 NFTs.</Trans>
        </div>
      ) : null}

      {valid ? (
        <>
          <div className="summary">
            <div className="summaryCard address">
              <div className="summaryLabel">
                <Trans>Address</Trans>
              </div>
              <Typography.Text className="summaryValue" copyable={{ text: address }}>
                {address}
              </Typography.Text>
            </div>
            <div className="summaryCard">
              <div className="summaryLabel">MRC-20</div>
              <div className="summaryValue accent">
                {mrcTotal === null ? "—" : <NumberFormat value={mrcTotal} />}
              </div>
            </div>
            <div className="summaryCard">
              <div className="summaryLabel">MRC-721</div>
              <div className="summaryValue accent">
                {nftHeld === null ? "—" : <NumberFormat value={nftHeld} />}
              </div>
            </div>
          </div>

          <div className="sectionHead">
            <h2>
              <Trans>MRC-20 Tokens</Trans>
            </h2>
            <div className="sub">
              <Trans>{network === "testnet" ? "Testnet" : "Mainnet"}</Trans>
            </div>
          </div>
          {mrcError ? (
            <div className="loadError">
              <Trans>{mrcError}</Trans>
              <Button size="small" onClick={() => setMrcReload((n) => n + 1)}>
                <Trans>Retry</Trans>
              </Button>
            </div>
          ) : (
            <Spin spinning={mrcLoading}>
              {mrcList.length === 0 ? (
                mrcLoading || mrcTotal === null ? (
                  <div className="holdPlace" />
                ) : (
                  <div className="emptyHold">
                    <Trans>No MRC-20 tokens at this address.</Trans>
                  </div>
                )
              ) : (
                <>
                  <div className="tokenTable">
                    <Table
                      rowKey="mrc20Id"
                      columns={columns}
                      dataSource={mrcList}
                      pagination={false}
                      scroll={{ x: 680 }}
                      onRow={(row) => ({
                        onClick: () => openToken(row),
                      })}
                    />
                  </div>
                  <div className="tokenCards">
                    {mrcList.map((row) => (
                      <div
                        role="button"
                        tabIndex={0}
                        className="tokenCard"
                        key={row.mrc20Id}
                        onClick={() => openToken(row)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") openToken(row);
                        }}
                      >
                        <TokenFace row={row} />
                        <div className="tokenStats">
                          <div>
                            <span className="k">
                              <Trans>Balance</Trans>
                            </span>
                            <span className="v">
                              <NumberFormat value={row.balance || 0} />
                            </span>
                          </div>
                          <div>
                            <span className="k">
                              <Trans>Price</Trans>
                            </span>
                            <span className="v">
                              <PriceCell info={row.tickInfo} />
                            </span>
                          </div>
                          <div>
                            <span className="k">
                              <Trans>Holders</Trans>
                            </span>
                            <span className="v">
                              {row.tickInfo ? (
                                <NumberFormat value={row.tickInfo.holders || 0} />
                              ) : (
                                "—"
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {mrcTotal !== null && mrcTotal > MRC20_SIZE ? (
                    <div className="pager">
                      <Pagination
                        current={mrcPage + 1}
                        pageSize={MRC20_SIZE}
                        total={mrcTotal}
                        showSizeChanger={false}
                        onChange={(page) => patchPaging({ mrc: page - 1 })}
                      />
                    </div>
                  ) : null}
                </>
              )}
            </Spin>
          )}

          <div className="sectionHead">
            <h2>
              <Trans>MRC-721 NFTs</Trans>
            </h2>
            <div className="sub">
              <Trans>Including MVC collections.</Trans>
            </div>
          </div>
          {albums.length > 0 ? (
            <div className="albums">
              <button
                type="button"
                className={album ? "albumChip" : "albumChip on"}
                onClick={() => patchPaging({ album: "", nft: 0 })}
              >
                <Trans>All</Trans>
              </button>
              {albums.map((col) => {
                const label = albumTitle(col);
                return (
                  <button
                    type="button"
                    key={col.pinid}
                    className={album === col.pinid ? "albumChip on" : "albumChip"}
                    onClick={() => patchPaging({ album: col.pinid, nft: 0 })}
                  >
                    <PinCover
                      src={contentUrl(col.cover, network)}
                      alt={label}
                      className=""
                      fallbackClass="albumFallback"
                    />
                    <span className="name">{label}</span>
                    <span className="own">{col.ownnum}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
          {nftError ? (
            <div className="loadError">
              <Trans>{nftError}</Trans>
              <Button size="small" onClick={() => setNftReload((n) => n + 1)}>
                <Trans>Retry</Trans>
              </Button>
            </div>
          ) : (
            <Spin spinning={nftLoading}>
              {nftList.length === 0 ? (
                nftLoading || nftTotal === null ? (
                  <div className="holdPlace" />
                ) : (
                  <div className="emptyHold">
                    <Trans>No MRC-721 NFTs at this address.</Trans>
                  </div>
                )
              ) : (
                <>
                  <div className="nftGrid">
                    {nftList.map((item) => {
                      const col = albumById.get(item.collectionPinId);
                      const title =
                        item.name ||
                        `${albumTitle(col, item.collectionName)} #${item.number}`;
                      const chain = item.chainName || item.genesisChainName;
                      return (
                        <div
                          role="button"
                          tabIndex={0}
                          className="nftCard"
                          key={item.itemPinId}
                          onClick={() => setOpenItem(item)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setOpenItem(item);
                            }
                          }}
                        >
                          <PinCover
                            src={contentUrl(item.cover || col?.cover, network)}
                            alt={title}
                            className="nftCover"
                            fallbackClass="nftCoverFallback"
                          />
                          <div className="nftBody">
                            <div className="nftTitle">{title}</div>
                            <div className="nftAlbum">
                              {albumTitle(col, item.collectionName)}
                            </div>
                            <div className="nftDesc">{item.desc || col?.desc || ""}</div>
                            <div className="nftMeta">
                              <span className="pill">#{item.number}</span>
                              {chain ? (
                                <span className="pill">{chain.toUpperCase()}</span>
                              ) : null}
                              {item.confirmed === false ? (
                                <span className="pill pending">
                                  <Trans>Unconfirmed</Trans>
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {nftTotal !== null && nftTotal > NFT_SIZE ? (
                    <div className="pager">
                      <Pagination
                        current={nftPage + 1}
                        pageSize={NFT_SIZE}
                        total={nftTotal}
                        showSizeChanger={false}
                        onChange={(page) => patchPaging({ nft: page - 1 })}
                      />
                    </div>
                  ) : null}
                </>
              )}
            </Spin>
          )}
        </>
      ) : null}

      <Modal
        open={!!openItem}
        title={<Trans>Item details</Trans>}
        footer={null}
        className="nftDetailModal"
        width="min(760px, calc(100vw - 32px))"
        onCancel={() => setOpenItem(null)}
        destroyOnClose
      >
        {openItem ? (
          <div className="detail">
            <PinCover
              src={openCover}
              alt={openName}
              className="detailCover"
              fallbackClass="detailFallback"
            />
            <div>
              <h3>{openName}</h3>
              <div className="albumName">
                <Trans>Album</Trans>
                {" · "}
                {albumTitle(openAlbum, openItem.collectionName)}
              </div>
              <div className="desc">
                {openItem.desc || openAlbum?.desc || "—"}
              </div>
              <div className="detailRows">
                <div>
                  <span>
                    <Trans>No.</Trans>
                  </span>
                  <b>#{openItem.number}</b>
                </div>
                <div>
                  <span>
                    <Trans>Chain</Trans>
                  </span>
                  <b>{(openItem.chainName || openItem.genesisChainName || "—").toUpperCase()}</b>
                </div>
                <div>
                  <span>
                    <Trans>Pin ID</Trans>
                  </span>
                  <Typography.Text copyable={{ text: openItem.itemPinId }}>
                    {openItem.itemPinId.slice(0, 8)}…{openItem.itemPinId.slice(-4)}
                  </Typography.Text>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
