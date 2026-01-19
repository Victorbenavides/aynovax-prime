from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from sqlalchemy import func # <--- IMPORTANTE: Necesario para sumar
from typing import List
from fastapi.responses import FileResponse
from app.reports import generate_pdf_report 
from app.schemas import MachineSensorData, PredictionResponse
from app.services import QualityPredictionService
from app.database import create_db_and_tables, get_session
from app.models import PredictionLog
from datetime import datetime
from typing import Optional

# Initialize App & DB
app = FastAPI(title="AynovaX Intelligent Core", version="2.5.0")

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ai_service = QualityPredictionService()

@app.get("/")
def health_check():
    return {"status": "ONLINE"}

# --- NUEVO ENDPOINT PARA KPIS REALES ---
@app.get("/api/v1/kpi")
def get_kpis(session: Session = Depends(get_session)):
    """Calcula el total histórico de ganancias y tickets"""
    # 1. Suma total de dinero (Profit)
    total_profit = session.exec(select(func.sum(PredictionLog.financial_impact))).first()
    if total_profit is None: 
        total_profit = 0.0
        
    # 2. Conteo total de tickets
    ticket_count = session.exec(select(func.count(PredictionLog.id)).where(PredictionLog.maintenance_ticket.isnot(None))).first()
    
    return {"netProfit": total_profit, "openTickets": ticket_count}
# ---------------------------------------

@app.post("/api/v1/predict", response_model=PredictionResponse)
def predict_quality(data: MachineSensorData, session: Session = Depends(get_session)):
    try:
        result = ai_service.predict(data.temperature_c, data.pressure_bar, data.vibration_hz)
        ticket_id = f"TKT-{datetime.now().strftime('%H%M%S')}" if result["ticket_required"] else None

        log_entry = PredictionLog(
            temperature=data.temperature_c, pressure=data.pressure_bar, vibration=data.vibration_hz,
            prediction=result["status"], confidence=result["confidence_score"], recommendation=result["recommendation"],
            financial_impact=result["financial_impact"], maintenance_ticket=ticket_id
        )
        session.add(log_entry)
        session.commit()
        session.refresh(log_entry)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/history", response_model=List[PredictionLog])
def get_recent_history(session: Session = Depends(get_session)):
    return session.exec(select(PredictionLog).order_by(PredictionLog.id.desc()).limit(10)).all()

@app.get("/api/v1/history/all", response_model=List[PredictionLog])
def get_all_history(session: Session = Depends(get_session)):
    return session.exec(select(PredictionLog).order_by(PredictionLog.id.desc())).all()

@app.post("/api/v1/history/batch/delete")
def batch_delete_logs(payload: dict, session: Session = Depends(get_session)):
    ids = payload.get("ids", [])
    statement = select(PredictionLog).where(PredictionLog.id.in_(ids))
    results = session.exec(statement).all()
    for log in results: session.delete(log)
    session.commit()
    return {"ok": True}

@app.post("/api/v1/reports/batch/pdf")
def batch_pdf_report(payload: dict, session: Session = Depends(get_session)):
    ids = payload.get("ids", [])
    statement = select(PredictionLog).where(PredictionLog.id.in_(ids)).order_by(PredictionLog.id.desc())
    logs = session.exec(statement).all()
    if not logs: raise HTTPException(404, detail="No data")
    filename = f"AynovaX_Selection_{datetime.now().strftime('%H%M%S')}.pdf"
    file_path = generate_pdf_report(logs, filename)
    return FileResponse(path=file_path, filename=filename, media_type='application/pdf')

@app.delete("/api/v1/history/advanced/prune")
def prune_history(delete_all: bool = False, session: Session = Depends(get_session)):
    if delete_all:
        session.exec(select(PredictionLog)).all() 
        session.query(PredictionLog).delete()
        session.commit()
    return {"message": "Purged"}