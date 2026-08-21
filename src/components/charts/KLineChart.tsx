'use client';

import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface StockDaily {
  tradeDate: string;
  open: number;
  close: number;
  low: number;
  high: number;
  volume: number;
}

interface KLineChartProps {
  data: StockDaily[];
  title?: string;
}

export function KLineChart({ data, title = '日K线图' }: KLineChartProps) {
  // 按日期排序
  const sortedData = [...data].sort((a, b) => 
    new Date(a.tradeDate).getTime() - new Date(b.tradeDate).getTime()
  );

  const dates = sortedData.map(d => d.tradeDate);
  // ECharts K线数据格式: [open, close, low, high]
  const klineData = sortedData.map(d => [d.open, d.close, d.low, d.high]);
  const volumes = sortedData.map(d => d.volume);

  // 计算涨跌颜色
  const volumeColors = sortedData.map(d => 
    d.close >= d.open ? '#ef4444' : '#22c55e'
  );

  const option: EChartsOption = {
    title: {
      text: title,
      left: 'center',
      textStyle: {
        color: '#333',
        fontSize: 16,
      },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
      },
      formatter: (params: any) => {
        if (!params || params.length === 0) return '';
        const date = params[0].axisValue;
        const kline = params.find((p: any) => p.seriesName === 'K线');
        const volume = params.find((p: any) => p.seriesName === '成交量');
        
        if (!kline) return date;
        
        const [open, close, low, high] = kline.data;
        const change = close - open;
        const changePercent = ((change / open) * 100).toFixed(2);
        const color = change >= 0 ? '#ef4444' : '#22c55e';
        
        return `
          <div style="font-size: 12px;">
            <div style="margin-bottom: 4px;">${date}</div>
            <div>开盘: <span style="color: ${color}">${open.toFixed(2)}</span></div>
            <div>收盘: <span style="color: ${color}">${close.toFixed(2)}</span></div>
            <div>最高: <span style="color: ${color}">${high.toFixed(2)}</span></div>
            <div>最低: <span style="color: ${color}">${low.toFixed(2)}</span></div>
            <div>涨跌: <span style="color: ${color}">${change >= 0 ? '+' : ''}${change.toFixed(2)} (${change >= 0 ? '+' : ''}${changePercent}%)</span></div>
            ${volume ? `<div>成交量: ${(volume.data / 10000).toFixed(2)}万</div>` : ''}
          </div>
        `;
      },
    },
    grid: [
      {
        left: '10%',
        right: '5%',
        top: '15%',
        height: '55%',
      },
      {
        left: '10%',
        right: '5%',
        top: '75%',
        height: '15%',
      },
    ],
    xAxis: [
      {
        type: 'category',
        data: dates,
        gridIndex: 0,
        axisLine: { lineStyle: { color: '#ccc' } },
        axisLabel: { show: false },
      },
      {
        type: 'category',
        data: dates,
        gridIndex: 1,
        axisLine: { lineStyle: { color: '#ccc' } },
        axisLabel: {
          fontSize: 10,
          rotate: 45,
        },
      },
    ],
    yAxis: [
      {
        scale: true,
        gridIndex: 0,
        splitLine: { lineStyle: { color: '#eee' } },
        axisLine: { lineStyle: { color: '#ccc' } },
      },
      {
        scale: true,
        gridIndex: 1,
        splitNumber: 2,
        axisLabel: {
          formatter: (value: number) => `${(value / 10000).toFixed(0)}万`,
          fontSize: 10,
        },
        splitLine: { lineStyle: { color: '#eee' } },
        axisLine: { lineStyle: { color: '#ccc' } },
      },
    ],
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: [0, 1],
        start: 0,
        end: 100,
      },
      {
        type: 'slider',
        xAxisIndex: [0, 1],
        top: '93%',
        height: 20,
      },
    ],
    series: [
      {
        name: 'K线',
        type: 'candlestick',
        data: klineData,
        xAxisIndex: 0,
        yAxisIndex: 0,
        itemStyle: {
          color: '#ef4444',        // 阳线填充色（红）
          color0: '#22c55e',       // 阴线填充色（绿）
          borderColor: '#ef4444',  // 阳线边框色
          borderColor0: '#22c55e', // 阴线边框色
        },
      },
      {
        name: '成交量',
        type: 'bar',
        data: volumes.map((v, i) => ({
          value: v,
          itemStyle: { color: volumeColors[i] },
        })),
        xAxisIndex: 1,
        yAxisIndex: 1,
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: '500px', width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
}
