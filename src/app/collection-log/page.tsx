"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

interface CollectionLog {
  id: string;
  collectionDate: string;
  dataType: string;
  status: string;
  count: number;
  message: string;
  startedAt: string;
  finishedAt: string;
}

export default function CollectionLogPage() {
  const [data, setData] = useState<CollectionLog[]>([]);
  const [loading, setLoading] = useState(true);
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

      const res = await fetch(`/api/collection/log?${params}`);
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
  }, [page]);

  const getDataTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      stock_daily: "日K线",
      dragon_tiger: "龙虎榜",
      dragon_tiger_detail: "龙虎榜明细",
    };
    return labels[type] || type;
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "--";
    const date = new Date(dateStr);
    return date.toLocaleString("zh-CN");
  };

  const getDuration = (start: string, end: string) => {
    if (!start || !end) return "--";
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const seconds = Math.floor(duration / 1000);
    if (seconds < 60) return `${seconds}秒`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
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
            <h1 className="text-2xl font-bold">采集日志</h1>
            <p className="text-sm text-slate-500">数据采集记录与状态</p>
          </div>
        </div>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>采集记录</CardTitle>
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
                      <TableHead>采集日期</TableHead>
                      <TableHead>数据类型</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead className="text-right">采集数量</TableHead>
                      <TableHead>耗时</TableHead>
                      <TableHead>开始时间</TableHead>
                      <TableHead>结束时间</TableHead>
                      <TableHead>消息</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                          暂无采集记录
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.collectionDate}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getDataTypeLabel(item.dataType)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={item.status === "success" ? "default" : "destructive"}
                              className={item.status === "success" ? "bg-green-500" : ""}
                            >
                              {item.status === "success" ? "成功" : "失败"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {item.count.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {getDuration(item.startedAt, item.finishedAt)}
                          </TableCell>
                          <TableCell className="text-sm text-slate-500">
                            {formatDateTime(item.startedAt)}
                          </TableCell>
                          <TableCell className="text-sm text-slate-500">
                            {formatDateTime(item.finishedAt)}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-sm text-slate-500">
                            {item.message || "--"}
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
