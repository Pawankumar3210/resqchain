from fastapi import APIRouter
from google import genai
from dotenv import load_dotenv
import os

load_dotenv("backend/.env")

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

router = APIRouter()

@router.get("/predict-disruption")
def predict_disruption(zone: str, weather: str, traffic: str):
    prompt = f"""
    You are an AI assistant for ResQChain, an emergency supply chain system.
    
    Analyze this situation and predict if there will be a disruption:
    - Zone: {zone}
    - Weather condition: {weather}
    - Traffic level: {traffic}
    
    Respond in this exact format:
    Risk Level: [Low/Medium/High/Critical]
    Prediction: [one sentence about what might happen]
    Recommendation: [one sentence on what action to take]
    """
    
    try:
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt
        )
        text = response.text.strip()
        
        lines = text.split("\n")
        result = {}
        for line in lines:
            if "Risk Level:" in line:
                result["risk_level"] = line.replace("Risk Level:", "").strip()
            elif "Prediction:" in line:
                result["prediction"] = line.replace("Prediction:", "").strip()
            elif "Recommendation:" in line:
                result["recommendation"] = line.replace("Recommendation:", "").strip()
        
        return {
            "zone": zone,
            "weather": weather,
            "traffic": traffic,
            "ai_analysis": result
        }
    except Exception as e:
        return {
            "zone": zone,
            "weather": weather,
            "traffic": traffic,
            "error": str(e)
        }

@router.get("/suggest-priority")
def suggest_priority(item: str, situation: str):
    prompt = f"""
    You are an AI assistant for ResQChain, an emergency supply chain system.
    
    Based on this delivery item and current situation, suggest the priority level:
    - Item: {item}
    - Current situation: {situation}
    
    Respond in this exact format:
    Priority: [High/Medium/Low]
    Reason: [one sentence explaining why]
    """
    
    try:
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt
        )
        text = response.text.strip()
        
        lines = text.split("\n")
        result = {}
        for line in lines:
            if "Priority:" in line:
                result["priority"] = line.replace("Priority:", "").strip()
            elif "Reason:" in line:
                result["reason"] = line.replace("Reason:", "").strip()
        
        return {
            "item": item,
            "situation": situation,
            "ai_suggestion": result
        }
    except Exception as e:
        return {
            "item": item,
            "situation": situation,
            "error": str(e)
        }