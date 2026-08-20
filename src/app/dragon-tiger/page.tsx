"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Search, ChevronLeft, ChevronRight } from "lucide-react";

interface DragonTigerItem {
  id: string;
  code: string;
  name: string;
  tradeDate: string;
  close: string;
  pctChange: string;
  netBuy: string;
  buyAmount: string;
  sellAmount: string;
  reason: string;
}

export default function DragonTigerPage() {
  const [data, setData] = useState<DragonTigerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: "20",
      });
      if (code) params.set("code", code);

      const res = await fetch(`/api/dragon-tiger/list?${params}`);
      const json = await res.json();
      
      if (json.success) {
        setData(json.data);
        setTotal(json.pagination.total);
        setTotalPages(json.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, code]);

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  const formatMoney = (num: string) => {
    const n = parseFloat(num);
    if (isNaN(n)) return "--";
    if (Math.abs(n) >= 100000000) return (n / 100000000).toFixed(2) + "亿";
    if (Math.abs(n) >= 10000) return (n / 10000).toFixed(2) + "万";
    return n.toFixed(2);
  };

  const formatPct = (num: string) => {
    const n = parseFloat(num);
    if (isNaN(n)) return "--";
    const color = n > 0 ? "text-red-500" : n < 0 ? "text-green-500" : "";
    return <span className={color}>{n > 0 ? "+" : ""}{n.toFixed(2)}%</span>;
  };

  const formatNetBuy = (num: string) => {
    const n = parseFloat(num);
    if (isNaN(n)) return "--";
    const color = n > 0 ? "text-red-500" : n < 0 ? "text-green-500" : "";
    const prefix = n > 0 ? "+" : "";
    return <span className={color}>{prefix}{formatMoney(num)}</span>;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">龙虎榜</h1>
            <p className="text-sm text-slate-500">每日上榜股票及买卖数据</p>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  placeholder="输入股票代码，如 000001"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch}>
                <Search className="mr-2 h-4 w-4" />
                搜索
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>上榜记录</CardTitle>
              <span className="text-sm text-slate-500">共 {total} 条记录</span>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>日期</TableHead>
                      <TableHead>代码</TableHead>
                      <TableHead>名称</TableHead>
                      <TableHead className="text-right">收盘价</TableHead>
                      <TableHead className="text-right">涨跌幅</TableHead>
                      <TableHead className="text-right">净买额</TableHead>
                      <TableHead className="text-right">买入额</TableHead>
                      <TableHead className="text-right">卖出额</TableHead>
                      <TableHead>上榜原因</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                          暂无数据
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.tradeDate}</TableCell>
                          <TableCell className="font-mono">{item.code}</TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-right font-mono">
                            {parseFloat(item.close).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatPct(item.pctChange)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatNetBuy(item.netBuy)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatMoney(item.buyAmount)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatMoney(item.sellAmount)}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-sm text-slate-500">
                            {item.reason || "--"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="text-sm text-slate-500">
                      第 {page} / {totalPages} 页
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage(p => p - 1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        上一页
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => setPage(p => p + 1)}
                      >
                        下一页
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
