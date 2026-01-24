from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class PredictionLog(SQLModel, table=True):
    """
    Table: prediction_log
    Stores every inference request for audit and analytics purposes.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    timestamp: datetime = Field(default_factory=datetime.now)
    
    
    # Inputs
    temperature: float
    pressure: float
    vibration: float
    
    # Outputs       
    prediction: str
    confidence: float
    recommendation: str

    financial_impact: float = Field(default=0.0)
    maintenance_ticket: Optional[str] = Field(default=None) #