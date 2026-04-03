from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class RefreshToken(BaseModel):
    refresh_token:str = Field(..., min_length=10, description="Refresh token của user")

class RefreshTokenResponse(BaseModel):
    access_token:str
    refresh_token:str
    token_type:str="bearer"

    class Config:
        from_attributes = True