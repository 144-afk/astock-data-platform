"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Search, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { KLineChart } from "@/components/charts/KLineChart";

interface StockDaily {
  id: string;
  code: string;
  name: string;
  tradeDate: string;
  open: string;
  high: string;
  low: string;
  close: string;
  pctChange: string;
  volume: string;
  amount: string;
  turnover: string;
}

export default function StockPage() {
  const [data, setData] = useState<StockDaily[]>([]);
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

      const res = await fetch(`/api/stock/daily?${params}`);
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

  const formatNumber = (num: string) => {
    const n = parseFloat(num);
    if (isNaN(n)) return "--";
    if (n >= 100000000) return (n / 100000000).toFixed(2) + "亿";
    if (n >= 10000) return (n / 10000).toFixed(2) + "万";
    return n.toFixed(2);
  };

  const formatPct = (num: string) => {
    const n = parseFloat(num);
    if (isNaN(n)) return "--";
    const color = n > 0 ? "text-red-500" : n < 0 ? "text-green-500" : "";
    return <span className={color}>{n > 0 ? "+" : ""}{n.toFixed(2)}%</span>;
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
            <h1 className="text-2xl font-bold">行情数据</h1>
            <p className="text-sm text-slate-500">全市场股票日K线数据</p>
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

        {/* K-Line Chart */}
        {data.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                <CardTitle>{data[0]?.name} ({data[0]?.code}) K线图</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <KLineChart
                data={data.map(d => ({
                  tradeDate: d.tradeDate,
                  open: parseFloat(d.open),
                  close: parseFloat(d.close),
                  low: parseFloat(d.low),
                  high: parseFloat(d.high),
                  volume: parseInt(d.volume),
                }))}
                title=""
              />
            </CardContent>
          </Card>
        )}

        {/* Data Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>数据列表</CardTitle>
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
                      <TableHead>代码</TableHead>
                      <TableHead>名称</TableHead>
                      <TableHead>日期</TableHead>
                      <TableHead className="text-right">收盘价</TableHead>
                      <TableHead className="text-right">涨跌幅</TableHead>
                      <TableHead className="text-right">成交量</TableHead>
                      <TableHead className="text-right">成交额</TableHead>
                      <TableHead className="text-right">换手率</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                          暂无数据
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono">{item.code}</TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.tradeDate}</TableCell>
                          <TableCell className="text-right font-mono">
                            {parseFloat(item.close).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatPct(item.pctChange)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatNumber(item.volume)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatNumber(item.amount)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {parseFloat(item.turnover).toFixed(2)}%
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
