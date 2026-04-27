from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes import delivery, routing, disruption, ai

app = FastAPI(title="ResQChain API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(delivery.router, prefix="/delivery", tags=["Delivery"])
app.include_router(routing.router, prefix="/route", tags=["Routing"])
app.include_router(disruption.router, prefix="/disruption", tags=["Disruption"])
app.include_router(ai.router, prefix="/ai", tags=["AI"])

@app.get("/")
def home():
    return {"message": "ResQChain Backend is Running! 🚀"}