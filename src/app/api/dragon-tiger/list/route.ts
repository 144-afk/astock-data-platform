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
    const where: Prisma.DragonTigerListWhereInput = {};
    
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
      prisma.dragonTigerList.findMany({
        where,
        orderBy: [{ tradeDate: "desc" }, { netBuy: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.dragonTigerList.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: data.map(item => ({
        ...item,
        id: item.id.toString(),
        close: item.close?.toString(),
        pctChange: item.pctChange?.toString(),
        turnover: item.turnover?.toString(),
        amount: item.amount?.toString(),
        netBuy: item.netBuy?.toString(),
        buyAmount: item.buyAmount?.toString(),
        sellAmount: item.sellAmount?.toString(),
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Failed to fetch dragon tiger list:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
