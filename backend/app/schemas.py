"""
AynovaX - Data Schemas
----------------------
Defines the structure for input data (Request) and output data (Response).
Using Pydantic allows for automatic validation and documentation generation.
"""

from pydantic import BaseModel, Field

class MachineSensorData(BaseModel):
    temperature_c: float = Field(..., description="Current machine temperature in Celsius", example=75.4)
    pressure_bar: float = Field(..., description="Hydraulic pressure in Bar", example=118.2)
    vibration_hz: float = Field(..., description="Vibration frequency in Hz", example=48.5)

class PredictionResponse(BaseModel):
    status: str = Field(..., description="The predicted state")
    confidence_score: float = Field(..., description="Model certainty")
    recommendation: str = Field(..., description="Actionable insight")
    processed_at: str = Field(..., description="ISO timestamp")
    
    financial_impact: float = Field(..., description="Calculated profit or loss")
    ticket_required: bool = Field(..., description="Maintenance flag")