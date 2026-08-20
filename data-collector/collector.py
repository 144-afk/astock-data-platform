"""A股数据采集器 - 行情数据和龙虎榜数据"""
import akshare as ak
import pandas as pd
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import text
import logging

from models import StockDaily, DragonTigerList, DragonTigerDetail, CollectionLog
from database import engine, SessionLocal, init_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)


class AStockCollector:
    """A股数据采集器"""
    
    def __init__(self):
        self.session = SessionLocal()
    
    def close(self):
        """关闭会话"""
        self.session.close()
    
    def log_collection(self, collection_date: date, data_type: str, 
                       status: str, count: int = 0, message: str = "",
                       started_at: datetime = None, finished_at: datetime = None):
        """记录采集日志"""
        log = CollectionLog(
            collection_date=collection_date,
            data_type=data_type,
            status=status,
            count=count,
            message=message,
            started_at=started_at,
            finished_at=finished_at
        )
        self.session.add(log)
        self.session.commit()
    
    def collect_stock_daily(self, target_date: date = None) -> int:
        """
        采集全市场股票日K线数据
        
        Args:
            target_date: 目标日期，默认为最近交易日
            
        Returns:
            采集的记录数
        """
        if target_date is None:
            target_date = date.today()
        
        started_at = datetime.now()
        logger.info(f"开始采集日K线数据，日期: {target_date}")
        
        try:
            # 获取全市场股票列表
            stock_list = ak.stock_zh_a_spot_em()
            logger.info(f"获取到 {len(stock_list)} 只股票")
            
            count = 0
            for _, stock in stock_list.iterrows():
                code = stock["代码"]
                name = stock["名称"]
                
                try:
                    # 获取单只股票的历史数据
                    df = ak.stock_zh_a_hist(
                        symbol=code,
                        period="daily",
                        start_date=target_date.strftime("%Y%m%d"),
                        end_date=target_date.strftime("%Y%m%d"),
                        adjust="qfq"
                    )
                    
                    if df.empty:
                        continue
                    
                    for _, row in df.iterrows():
                        trade_date = pd.to_datetime(row["日期"]).date()
                        
                        # 检查是否已存在
                        existing = self.session.query(StockDaily).filter_by(
                            code=code, trade_date=trade_date
                        ).first()
                        
                        if existing:
                            continue
                        
                        daily = StockDaily(
                            code=code,
                            name=name,
                            trade_date=trade_date,
                            open=row.get("开盘"),
                            high=row.get("最高"),
                            low=row.get("最低"),
                            close=row.get("收盘"),
                            pre_close=row.get("昨收"),
                            change=row.get("涨跌额"),
                            pct_change=row.get("涨跌幅"),
                            volume=row.get("成交量"),
                            amount=row.get("成交额"),
                            turnover=row.get("换手率")
                        )
                        self.session.add(daily)
                        count += 1
                    
                    if count % 100 == 0 and count > 0:
                        self.session.commit()
                        logger.info(f"已采集 {count} 条记录")
                        
                except Exception as e:
                    logger.warning(f"采集 {code} {name} 失败: {e}")
                    continue
            
            self.session.commit()
            
            finished_at = datetime.now()
            self.log_collection(
                target_date, "stock_daily", "success", count,
                started_at=started_at, finished_at=finished_at
            )
            
            logger.info(f"日K线数据采集完成，共 {count} 条记录")
            return count
            
        except Exception as e:
            logger.error(f"日K线数据采集失败: {e}")
            finished_at = datetime.now()
            self.log_collection(
                target_date, "stock_daily", "failed", 0, str(e),
                started_at=started_at, finished_at=finished_at
            )
            raise
    
    def collect_dragon_tiger_list(self, target_date: date = None) -> int:
        """
        采集龙虎榜数据
        
        Args:
            target_date: 目标日期，默认为最近交易日
            
        Returns:
            采集的记录数
        """
        if target_date is None:
            target_date = date.today()
        
        started_at = datetime.now()
        logger.info(f"开始采集龙虎榜数据，日期: {target_date}")
        
        try:
            # 获取龙虎榜数据
            df = ak.stock_lhb_detail_em(
                start_date=target_date.strftime("%Y%m%d"),
                end_date=target_date.strftime("%Y%m%d")
            )
            
            if df.empty:
                logger.info("当日无龙虎榜数据")
                self.log_collection(
                    target_date, "dragon_tiger", "success", 0, "无数据",
                    started_at=started_at, finished_at=datetime.now()
                )
                return 0
            
            count = 0
            for _, row in df.iterrows():
                trade_date = pd.to_datetime(row["日期"]).date()
                code = row["代码"]
                name = row["名称"]
                reason = row.get("上榜原因", "")
                
                # 检查是否已存在
                existing = self.session.query(DragonTigerList).filter_by(
                    trade_date=trade_date, code=code, reason=reason
                ).first()
                
                if existing:
                    continue
                
                dtl = DragonTigerList(
                    trade_date=trade_date,
                    code=code,
                    name=name,
                    close=row.get("收盘价"),
                    pct_change=row.get("涨跌幅"),
                    turnover=row.get("换手率"),
                    amount=row.get("龙虎榜成交额"),
                    net_buy=row.get("龙虎榜净买额"),
                    buy_amount=row.get("买入总额"),
                    sell_amount=row.get("卖出总额"),
                    reason=reason
                )
                self.session.add(dtl)
                count += 1
            
            self.session.commit()
            
            finished_at = datetime.now()
            self.log_collection(
                target_date, "dragon_tiger", "success", count,
                started_at=started_at, finished_at=finished_at
            )
            
            logger.info(f"龙虎榜数据采集完成，共 {count} 条记录")
            return count
            
        except Exception as e:
            logger.error(f"龙虎榜数据采集失败: {e}")
            finished_at = datetime.now()
            self.log_collection(
                target_date, "dragon_tiger", "failed", 0, str(e),
                started_at=started_at, finished_at=finished_at
            )
            raise
    
    def collect_dragon_tiger_detail(self, target_date: date = None) -> int:
        """
        采集龙虎榜营业部明细
        
        Args:
            target_date: 目标日期，默认为最近交易日
            
        Returns:
            采集的记录数
        """
        if target_date is None:
            target_date = date.today()
        
        started_at = datetime.now()
        logger.info(f"开始采集龙虎榜营业部明细，日期: {target_date}")
        
        try:
            # 获取龙虎榜营业部明细
            df = ak.stock_lhb_stock_statistic_em(symbol="近一月")
            
            if df.empty:
                logger.info("当日无龙虎榜明细数据")
                self.log_collection(
                    target_date, "dragon_tiger_detail", "success", 0, "无数据",
                    started_at=started_at, finished_at=datetime.now()
                )
                return 0
            
            count = 0
            for _, row in df.iterrows():
                trade_date = pd.to_datetime(row["上榜日期"]).date()
                
                if trade_date != target_date:
                    continue
                
                code = row["代码"]
                name = row["名称"]
                
                # 买入前5名
                for i in range(1, 6):
                    trader_col = f"买入营业部{i}"
                    buy_col = f"买入额{i}"
                    
                    if trader_col not in row or pd.isna(row[trader_col]):
                        continue
                    
                    detail = DragonTigerDetail(
                        trade_date=trade_date,
                        code=code,
                        name=name,
                        rank=i,
                        trader=row[trader_col],
                        buy_amount=row.get(buy_col),
                        direction="buy"
                    )
                    self.session.add(detail)
                    count += 1
                
                # 卖出前5名
                for i in range(1, 6):
                    trader_col = f"卖出营业部{i}"
                    sell_col = f"卖出额{i}"
                    
                    if trader_col not in row or pd.isna(row[trader_col]):
                        continue
                    
                    detail = DragonTigerDetail(
                        trade_date=trade_date,
                        code=code,
                        name=name,
                        rank=i,
                        trader=row[trader_col],
                        sell_amount=row.get(sell_col),
                        direction="sell"
                    )
                    self.session.add(detail)
                    count += 1
            
            self.session.commit()
            
            finished_at = datetime.now()
            self.log_collection(
                target_date, "dragon_tiger_detail", "success", count,
                started_at=started_at, finished_at=finished_at
            )
            
            logger.info(f"龙虎榜明细采集完成，共 {count} 条记录")
            return count
            
        except Exception as e:
            logger.error(f"龙虎榜明细采集失败: {e}")
            finished_at = datetime.now()
            self.log_collection(
                target_date, "dragon_tiger_detail", "failed", 0, str(e),
                started_at=started_at, finished_at=finished_at
            )
            raise
    
    def collect_all(self, target_date: date = None):
        """采集所有数据"""
        if target_date is None:
            target_date = date.today()
        
        logger.info(f"=== 开始全量数据采集，日期: {target_date} ===")
        
        results = {}
        
        try:
            results["stock_daily"] = self.collect_stock_daily(target_date)
        except Exception as e:
            logger.error(f"日K线采集失败: {e}")
            results["stock_daily"] = f"failed: {e}"
        
        try:
            results["dragon_tiger"] = self.collect_dragon_tiger_list(target_date)
        except Exception as e:
            logger.error(f"龙虎榜采集失败: {e}")
            results["dragon_tiger"] = f"failed: {e}"
        
        try:
            results["dragon_tiger_detail"] = self.collect_dragon_tiger_detail(target_date)
        except Exception as e:
            logger.error(f"龙虎榜明细采集失败: {e}")
            results["dragon_tiger_detail"] = f"failed: {e}"
        
        logger.info(f"=== 采集完成 ===")
        logger.info(f"结果: {results}")
        
        return results


def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description="A股数据采集器")
    parser.add_argument("--date", type=str, help="采集日期，格式: YYYY-MM-DD，默认为今天")
    parser.add_argument("--type", type=str, choices=["all", "daily", "dragon"], 
                        default="all", help="采集类型")
    parser.add_argument("--init-db", action="store_true", help="初始化数据库")
    
    args = parser.parse_args()
    
    # 初始化数据库
    if args.init_db:
        logger.info("初始化数据库...")
        init_db()
        logger.info("数据库初始化完成")
        return
    
    # 解析日期
    target_date = None
    if args.date:
        target_date = datetime.strptime(args.date, "%Y-%m-%d").date()
    
    # 创建采集器
    collector = AStockCollector()
    
    try:
        if args.type == "all":
            collector.collect_all(target_date)
        elif args.type == "daily":
            collector.collect_stock_daily(target_date)
        elif args.type == "dragon":
            collector.collect_dragon_tiger_list(target_date)
            collector.collect_dragon_tiger_detail(target_date)
    finally:
        collector.close()


if __name__ == "__main__":
    main()
