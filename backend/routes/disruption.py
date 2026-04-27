from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

# Store active disruptions
disruptions = []

# This defines what a disruption report looks like
class DisruptionReport(BaseModel):
    zone: str
    type: str  # "flood", "traffic", "blockage"
    severity: int  # 1 = low, 2 = medium, 3 = critical

# Severity label helper
def get_severity_label(severity: int):
    if severity == 1:
        return "🟡 Low"
    elif severity == 2:
        return "🟠 Medium"
    else:
        return "🔴 Critical"

@router.post("/report")
def report_disruption(report: DisruptionReport):
    disruption = {
        "id": len(disruptions) + 1,
        "zone": report.zone,
        "type": report.type,
        "severity": report.severity,
        "severity_label": get_severity_label(report.severity),
        "reported_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "active": True
    }
    disruptions.append(disruption)
    return {"message": f"⚠️ Disruption reported in {report.zone}!", "disruption": disruption}

@router.get("/active")
def get_active_disruptions():
    active = [d for d in disruptions if d["active"]]
    return {
        "total_active": len(active),
        "disruptions": active
    }

@router.get("/check/{zone}")
def check_zone(zone: str):
    zone_disruptions = [d for d in disruptions if d["zone"] == zone and d["active"]]
    if zone_disruptions:
        highest = max(zone_disruptions, key=lambda x: x["severity"])
        return {
            "zone": zone,
            "is_disrupted": True,
            "highest_severity": highest["severity_label"],
            "disruption_type": highest["type"],
            "message": f"⚠️ Avoid {zone}! {highest['type'].capitalize()} detected!"
        }
    return {
        "zone": zone,
        "is_disrupted": False,
        "message": f"✅ {zone} is clear!"
    }

@router.delete("/resolve/{disruption_id}")
def resolve_disruption(disruption_id: int):
    for d in disruptions:
        if d["id"] == disruption_id:
            d["active"] = False
            return {"message": f"✅ Disruption {disruption_id} resolved!"}
    return {"error": "Disruption not found"}