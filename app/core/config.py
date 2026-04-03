from pydantic_settings import BaseSettings # BaseSettings dùng để cấu hình
from pydantic import ConfigDict            # Nhận path, import path .env
from functools import lru_cache            

class Settings(BaseSettings):
    DEBUG:bool=True

    DB_PASSWORD:str=''

    DB_NAME:str=''

    DB_USER:str=''

    SECRET_KEY:str=''
    ALGORITHM:str=''
    ACCESS_TOKEN_EXPIRE_MINUTES:int=0
    REFRESH_TOKEN_EXPIRE_MINUTES:int=10080

    @property # def A() -> Settings Obj -> Call: Obj.A [Không cần ()]
    def DATABASE_URL(self):
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@localhost:3306/{self.DB_NAME}?charset=utf8mb4"
        )
    

    model_config = ConfigDict(
        env_file='.env',           # path đến file .env
        env_file_endcoding='utf-8'
    )

@lru_cache
def get_setting() -> Settings:
    return Settings()

# Ở các file khác chỉ cần settings.DEBUG, settings.DATABASE_URL, ...
settings = Settings()              