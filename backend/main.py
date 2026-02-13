from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import transactions, model_eval

app = FastAPI(title="Fraud Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(transactions.router)
app.include_router(model_eval.router)
