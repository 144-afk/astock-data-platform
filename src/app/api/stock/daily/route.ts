import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// 聚合函数：将日K线数据聚合为周线或月线
function aggregateKLineData(
  data: Array<{
    tradeDate: Date;
    open: number | null;
    high: number | null;
    low: number | null;
    close: number | null;
    volume: number | null;
    amount: number | null;
    preClose: number | null;
    change: number | null;
    pctChange: number | null;
    turnover: number | null;
    code: string;
    name: string | null;
  }>,
  period: "week" | "month"
) {
  if (data.length === 0) return [];

  // 按日期升序排序
  const sorted = [...data].sort(
    (a, b) => a.tradeDate.getTime() - b.tradeDate.getTime()
  );

  const groups = new Map<
    string,
    Array<{
      tradeDate: Date;
      open: number | null;
      high: number | null;
      low: number | null;
      close: number | null;
      volume: number | null;
      amount: number | null;
      preClose: number | null;
      change: number | null;
      pctChange: number | null;
      turnover: number | null;
      code: string;
      name: string | null;
    }>
  >();

  for (const item of sorted) {
    const date = new Date(item.tradeDate);
    let key: string;

    if (period === "week") {
      // 获取该日期所在周的周一
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(date.setDate(diff));
      key = monday.toISOString().split("T")[0];
    } else {
      // 按月
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    }

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(item);
  }

  // 聚合每组数据
  const result = [];
  for (const [key, items] of groups) {
    const first = items[0];
    const last = items[items.length - 1];

    const open = first.open;
    const close = last.close;
    const high = Math.max(...items.map((i) => i.high ?? 0));
    const low = Math.min(...items.map((i) => i.low ?? Infinity));
    const volume = items.reduce((sum, i) => sum + (i.volume ?? 0), 0);
    const amount = items.reduce((sum, i) => sum + (i.amount ?? 0), 0);
    const preClose = first.preClose;
    const change = close && preClose ? close - preClose : null;
    const pctChange =
      preClose && change ? ((change / preClose) * 100).toFixed(2) : null;

    result.push({
      id: key,
      code: first.code,
      name: first.name,
      tradeDate: last.tradeDate,
      open: open?.toString() ?? null,
      high: high.toString(),
      low: low === Infinity ? null : low.toString(),
      close: close?.toString() ?? null,
      preClose: preClose?.toString() ?? null,
      change: change?.toString() ?? null,
      pctChange,
      volume: volume.toString(),
      amount: amount.toString(),
      turnover: null,
    });
  }

  // 按日期降序排序
  return result.sort(
    (a, b) =>
      new Date(b.tradeDate).getTime() - new Date(a.tradeDate).getTime()
  );
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const code = searchParams.get("code");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const period = searchParams.get("period") || "day"; // day, week, month
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "50");

  try {
    const where: Prisma.StockDailyWhereInput = {};

    if (code) {
      where.code = code;
    }

    if (startDate || endDate) {
      where.tradeDate = {};
      if (startDate) {
        where.tradeDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.tradeDate.lte = new Date(endDate);
      }
    }

    // 对于周线和月线，需要获取更多数据来聚合
    const fetchSize = period === "day" ? pageSize : pageSize * 10;

    const [rawData, total] = await Promise.all([
      prisma.stockDaily.findMany({
        where,
        orderBy: { tradeDate: "desc" },
        skip: period === "day" ? (page - 1) * pageSize : 0,
        take: fetchSize,
      }),
      prisma.stockDaily.count({ where }),
    ]);

    let data;
    if (period === "week" || period === "month") {
      const aggregated = aggregateKLineData(
        rawData.map((item) => ({
          ...item,
          open: item.open ? Number(item.open) : null,
          high: item.high ? Number(item.high) : null,
          low: item.low ? Number(item.low) : null,
          close: item.close ? Number(item.close) : null,
          volume: item.volume ? Number(item.volume) : null,
          amount: item.amount ? Number(item.amount) : null,
          preClose: item.preClose ? Number(item.preClose) : null,
          change: item.change ? Number(item.change) : null,
          pctChange: item.pctChange ? Number(item.pctChange) : null,
          turnover: item.turnover ? Number(item.turnover) : null,
        })),
        period as "week" | "month"
      );
      // 分页
      const start = (page - 1) * pageSize;
      data = aggregated.slice(start, start + pageSize);
    } else {
      data = rawData.map((item) => ({
        ...item,
        id: item.id.toString(),
        volume: item.volume?.toString(),
        open: item.open?.toString(),
        high: item.high?.toString(),
        low: item.low?.toString(),
        close: item.close?.toString(),
        preClose: item.preClose?.toString(),
        change: item.change?.toString(),
        pctChange: item.pctChange?.toString(),
        amount: item.amount?.toString(),
        turnover: item.turnover?.toString(),
      }));
    }

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Failed to fetch stock daily data:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch data", details: errorMessage },
      { status: 500 }
    );
  }
}
