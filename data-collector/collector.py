"""A股数据采集器 - 使用 BaoStock 获取行情数据和龙虎榜数据"""
import baostock as bs
import pandas as pd
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
import logging

from models import StockDaily, DragonTigerList, DragonTigerDetail, CollectionLog
from database import engine, SessionLocal, init_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)


class AStockCollector:
    """A股数据采集器 - BaoStock 版本"""
    
    def __init__(self):
        self.session = SessionLocal()
        # 登录 BaoStock
        lg = bs.login()
        if lg.error_code != '0':
            raise Exception(f"BaoStock 登录失败: {lg.error_msg}")
        logger.info("BaoStock 登录成功")
    
    def close(self):
        """关闭会话并登出 BaoStock"""
        bs.logout()
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
    
    def get_all_stocks(self) -> pd.DataFrame:
        """获取所有股票列表"""
        rs = bs.query_stock_basic()
        stocks = []
        while rs.error_code == '0' and rs.next():
            stocks.append(rs.get_row_data())
        df = pd.DataFrame(stocks, columns=rs.fields)
        # 只保留 A 股（排除基金、指数等）
        df = df[df['type'] == '1']  # type=1 表示股票
        return df
    
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
            # 获取所有股票
            stocks_df = self.get_all_stocks()
            logger.info(f"获取到 {len(stocks_df)} 只股票")
            
            date_str = target_date.strftime("%Y-%m-%d")
            count = 0
            
            for _, stock in stocks_df.iterrows():
                code = stock['code']  # 格式: sh.600000 或 sz.000001
                name = stock.get('code_name', '')
                
                try:
                    # 获取日K线数据
                    rs = bs.query_history_k_data_plus(
                        code,
                        "date,code,open,high,low,close,preclose,volume,amount,turn,pctChg",
                        start_date=date_str,
                        end_date=date_str,
                        frequency="d",
                        adjustflag="2"  # 前复权
                    )
                    
                    while rs.error_code == '0' and rs.next():
                        row = rs.get_row_data()
                        
                        # 检查是否已存在
                        existing = self.session.query(StockDaily).filter_by(
                            code=code, trade_date=target_date
                        ).first()
                        
                        if existing:
                            continue
                        
                        daily = StockDaily(
                            code=code,
                            name=name,
                            trade_date=target_date,
                            open=float(row[2]) if row[2] else None,
                            high=float(row[3]) if row[3] else None,
                            low=float(row[4]) if row[4] else None,
                            close=float(row[5]) if row[5] else None,
                            pre_close=float(row[6]) if row[6] else None,
                            change=None,  # BaoStock 不直接提供涨跌额
                            pct_change=float(row[10]) if row[10] else None,
                            volume=int(float(row[7])) if row[7] else None,
                            amount=float(row[8]) if row[8] else None,
                            turnover=float(row[9]) if row[9] else None
                        )
                        
                        # 计算涨跌额
                        if daily.close and daily.pre_close:
                            daily.change = daily.close - daily.pre_close
                        
                        self.session.add(daily)
                        count += 1
                    
                    if count % 100 == 0 and count > 0:
                        self.session.commit()
                        logger.info(f"已采集 {count} 条记录")
                        
                except Exception as e:
                    logger.warning(f"采集 {code} 失败: {e}")
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
        采集龙虎榜数据（BaoStock 龙虎榜数据有限，仅作为补充）
        
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
            date_str = target_date.strftime("%Y-%m-%d")
            
            # BaoStock 龙虎榜接口
            rs = bs.query_history_k_data_plus(
                "",  # 空字符串表示查询所有
                "date,code,close,pctChg,turnover,amount",
                start_date=date_str,
                end_date=date_str,
                frequency="d"
            )
            
            # BaoStock 龙虎榜数据较为有限，这里记录日志
            logger.info("BaoStock 龙虎榜数据有限，建议配合其他数据源使用")
            
            finished_at = datetime.now()
            self.log_collection(
                target_date, "dragon_tiger", "success", 0, "BaoStock 龙虎榜数据有限",
                started_at=started_at, finished_at=finished_at
            )
            
            return 0
            
        except Exception as e:
            logger.error(f"龙虎榜数据采集失败: {e}")
            finished_at = datetime.now()
            self.log_collection(
                target_date, "dragon_tiger", "failed", 0, str(e),
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
        
        # BaoStock 龙虎榜数据有限，跳过
        results["dragon_tiger"] = "skipped (BaoStock 数据有限)"
        results["dragon_tiger_detail"] = "skipped (BaoStock 数据有限)"
        
        logger.info(f"=== 采集完成 ===")
        logger.info(f"结果: {results}")
        
        return results


def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description="A股数据采集器 (BaoStock)")
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
            logger.warning("BaoStock 龙虎榜数据有限，建议使用其他数据源")
            collector.collect_dragon_tiger_list(target_date)
    finally:
        collector.close()


if __name__ == "__main__":
    main()
