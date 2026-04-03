from pydantic import BaseModel

class TokenOut(BaseModel):
    access_token:str
    refresh_token:str
    role: str
    token_type:str = "bearer"
