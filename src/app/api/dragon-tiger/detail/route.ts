import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const code = searchParams.get("code");
  const tradeDate = searchParams.get("tradeDate");
  const direction = searchParams.get("direction");

  try {
    const where: Record<string, unknown> = {};
    
    if (code) {
      where.code = code;
    }
    
    if (tradeDate) {
      where.tradeDate = new Date(tradeDate);
    }
    
    if (direction) {
      where.direction = direction;
    }

    const data = await prisma.dragonTigerDetail.findMany({
      where,
      orderBy: [{ tradeDate: "desc" }, { rank: "asc" }],
    });

    return NextResponse.json({
      success: true,
      data: data.map(item => ({
        ...item,
        id: item.id.toString(),
        buyAmount: item.buyAmount?.toString(),
        sellAmount: item.sellAmount?.toString(),
        netAmount: item.netAmount?.toString(),
      })),
    });
  } catch (error) {
    console.error("Failed to fetch dragon tiger detail:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
