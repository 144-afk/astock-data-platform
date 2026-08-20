"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, BarChart3, Database, Activity } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            A股数据平台
          </h1>
          <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">
            行情数据采集与分析
          </p>
        </header>

        {/* Stats Cards */}
        <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">股票数量</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <div className="px-6 pb-4">
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">已采集股票</p>
            </div>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">数据记录</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <div className="px-6 pb-4">
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">日K线数据</p>
            </div>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">龙虎榜</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <div className="px-6 pb-4">
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">上榜记录</p>
            </div>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">采集状态</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <div className="px-6 pb-4">
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">最近采集</p>
            </div>
          </Card>
        </div>

        {/* Navigation Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/stock">
            <Card className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
                    <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle>行情数据</CardTitle>
                    <CardDescription>查看全市场日K线数据</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dragon-tiger">
            <Card className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-red-100 p-2 dark:bg-red-900/30">
                    <TrendingUp className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <CardTitle>龙虎榜</CardTitle>
                    <CardDescription>查看龙虎榜上榜数据</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/collection-log">
            <Card className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/30">
                    <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle>采集日志</CardTitle>
                    <CardDescription>查看数据采集记录</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Footer Info */}
        <div className="mt-12 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-lg font-semibold mb-3">数据说明</h3>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li>• <strong>数据来源</strong>：AKShare 开源数据接口</li>
            <li>• <strong>行情数据</strong>：全市场股票日K线，包含开高低收、成交量、换手率等</li>
            <li>• <strong>龙虎榜</strong>：每日上榜股票及营业部买卖明细</li>
            <li>• <strong>更新频率</strong>：每日盘后自动采集</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
