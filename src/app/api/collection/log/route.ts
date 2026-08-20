import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const dataType = searchParams.get("dataType");
  const status = searchParams.get("status");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "50");

  try {
    const where: Prisma.CollectionLogWhereInput = {};
    
    if (dataType) {
      where.dataType = dataType;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (startDate || endDate) {
      where.collectionDate = {};
      if (startDate) {
        where.collectionDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.collectionDate.lte = new Date(endDate);
      }
    }

    const [data, total] = await Promise.all([
      prisma.collectionLog.findMany({
        where,
        orderBy: { collectionDate: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.collectionLog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: data.map(item => ({
        ...item,
        id: item.id.toString(),
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Failed to fetch collection logs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
