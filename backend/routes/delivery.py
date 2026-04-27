from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

# This defines what a delivery request looks like
class DeliveryRequest(BaseModel):
    item: str
    destination: str
    requester_type: str  # "hospital", "grocery", "general"

# This assigns priority based on requester type
def assign_priority(requester_type: str):
    if requester_type == "hospital":
        return {"level": 1, "label": "🔴 High"}
    elif requester_type == "grocery":
        return {"level": 2, "label": "🟡 Medium"}
    else:
        return {"level": 3, "label": "🟢 Low"}

# Store deliveries in memory for now
deliveries = []

@router.post("/request")
def create_delivery(request: DeliveryRequest):
    priority = assign_priority(request.requester_type)
    delivery = {
        "id": len(deliveries) + 1,
        "item": request.item,
        "destination": request.destination,
        "requester_type": request.requester_type,
        "priority": priority,
        "status": "Pending",
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    deliveries.append(delivery)
    return {"message": "Delivery request created!", "delivery": delivery}

@router.get("/all")
def get_all_deliveries():
    sorted_deliveries = sorted(deliveries, key=lambda x: x["priority"]["level"])
    return {"deliveries": sorted_deliveries}