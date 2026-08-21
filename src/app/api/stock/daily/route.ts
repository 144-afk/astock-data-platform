import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const code = searchParams.get("code");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
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

    const [data, total] = await Promise.all([
      prisma.stockDaily.findMany({
        where,
        orderBy: { tradeDate: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.stockDaily.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: data.map(item => ({
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
      })),
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
