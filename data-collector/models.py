"""数据库模型定义"""
from datetime import datetime, date
from decimal import Decimal
from sqlalchemy import (
    create_engine, Column, Integer, String, Date, DateTime, 
    Numeric, BigInteger, Index, UniqueConstraint, text
)
from sqlalchemy.orm import DeclarativeBase, sessionmaker


class Base(DeclarativeBase):
    pass


class StockDaily(Base):
    """股票日K线数据"""
    __tablename__ = "stock_daily"
    
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    code = Column(String(10), nullable=False, comment="股票代码")
    name = Column(String(50), comment="股票名称")
    trade_date = Column(Date, nullable=False, comment="交易日期")
    
    open = Column(Numeric(12, 4), comment="开盘价")
    high = Column(Numeric(12, 4), comment="最高价")
    low = Column(Numeric(12, 4), comment="最低价")
    close = Column(Numeric(12, 4), comment="收盘价")
    pre_close = Column(Numeric(12, 4), comment="前收盘价")
    change = Column(Numeric(12, 4), comment="涨跌额")
    pct_change = Column(Numeric(10, 4), comment="涨跌幅(%)")
    volume = Column(BigInteger, comment="成交量(手)")
    amount = Column(Numeric(20, 4), comment="成交额(元)")
    turnover = Column(Numeric(10, 6), comment="换手率(%)")
    
    created_at = Column(DateTime, default=datetime.now, server_default=text("NOW()"))
    
    __table_args__ = (
        UniqueConstraint("code", "trade_date", name="uq_stock_daily_code_date"),
        Index("ix_stock_daily_code", "code"),
        Index("ix_stock_daily_date", "trade_date"),
    )


class DragonTigerList(Base):
    """龙虎榜数据"""
    __tablename__ = "dragon_tiger_list"
    
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    trade_date = Column(Date, nullable=False, comment="交易日期")
    code = Column(String(10), nullable=False, comment="股票代码")
    name = Column(String(50), comment="股票名称")
    
    close = Column(Numeric(12, 4), comment="收盘价")
    pct_change = Column(Numeric(10, 4), comment="涨跌幅(%)")
    turnover = Column(Numeric(10, 6), comment="换手率(%)")
    amount = Column(Numeric(20, 4), comment="龙虎榜成交额(元)")
    net_buy = Column(Numeric(20, 4), comment="龙虎榜净买额(元)")
    buy_amount = Column(Numeric(20, 4), comment="买入总额(元)")
    sell_amount = Column(Numeric(20, 4), comment="卖出总额(元)")
    
    reason = Column(String(200), comment="上榜原因")
    
    created_at = Column(DateTime, default=datetime.now, server_default=text("NOW()"))
    
    __table_args__ = (
        UniqueConstraint("trade_date", "code", "reason", name="uq_dtl_date_code_reason"),
        Index("ix_dtl_date", "trade_date"),
        Index("ix_dtl_code", "code"),
    )


class DragonTigerDetail(Base):
    """龙虎榜营业部明细"""
    __tablename__ = "dragon_tiger_detail"
    
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    trade_date = Column(Date, nullable=False, comment="交易日期")
    code = Column(String(10), nullable=False, comment="股票代码")
    name = Column(String(50), comment="股票名称")
    
    rank = Column(Integer, comment="排名")
    trader = Column(String(200), comment="营业部名称")
    
    buy_amount = Column(Numeric(20, 4), comment="买入额(元)")
    sell_amount = Column(Numeric(20, 4), comment="卖出额(元)")
    net_amount = Column(Numeric(20, 4), comment="净买额(元)")
    
    direction = Column(String(10), comment="买卖方向(buy/sell)")
    
    created_at = Column(DateTime, default=datetime.now, server_default=text("NOW()"))
    
    __table_args__ = (
        Index("ix_dtd_date_code", "trade_date", "code"),
    )


class CollectionLog(Base):
    """数据采集日志"""
    __tablename__ = "collection_log"
    
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    collection_date = Column(Date, nullable=False, comment="采集日期")
    data_type = Column(String(50), nullable=False, comment="数据类型")
    status = Column(String(20), nullable=False, comment="状态(success/failed)")
    count = Column(Integer, default=0, comment="采集数量")
    message = Column(String(500), comment="消息")
    
    started_at = Column(DateTime, comment="开始时间")
    finished_at = Column(DateTime, comment="结束时间")
    
    __table_args__ = (
        Index("ix_log_date_type", "collection_date", "data_type"),
    )
