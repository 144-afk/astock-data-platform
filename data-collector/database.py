"""数据库连接配置 - SQLite 版本"""
import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# SQLite 数据库路径
DB_DIR = Path(__file__).parent / "data"
DB_DIR.mkdir(exist_ok=True)

# 默认 SQLite 连接字符串
DEFAULT_DB_URL = f"sqlite:///{DB_DIR / 'a_stock_data.db'}"

# 获取环境变量，如果是 Prisma 格式则转换为 SQLAlchemy 格式
env_url = os.getenv("DATABASE_URL", "")
if env_url.startswith("file:"):
    # Prisma 格式: file:./data/a_stock_data.db 或 file:../data/a_stock_data.db
    db_path = env_url.replace("file:", "")
    if not db_path.startswith("/"):
        # 相对于 data-collector 目录解析路径
        db_path = str((Path(__file__).parent / db_path).resolve())
    DATABASE_URL = f"sqlite:///{db_path}"
elif env_url.startswith("sqlite"):
    DATABASE_URL = env_url
else:
    # 默认使用项目根目录的 data 目录
    project_root = Path(__file__).parent.parent
    default_db_dir = project_root / "data"
    default_db_dir.mkdir(exist_ok=True)
    DATABASE_URL = f"sqlite:///{default_db_dir / 'a_stock_data.db'}"

engine = create_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False}  # SQLite 需要
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def get_session():
    """获取数据库会话"""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def init_db():
    """初始化数据库表"""
    from models import Base
    Base.metadata.create_all(bind=engine)
    print(f"Database initialized at: {DB_DIR / 'a_stock_data.db'}")
