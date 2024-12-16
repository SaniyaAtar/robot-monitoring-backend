from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import random
import uuid
from datetime import datetime

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-site.netlify.app"],  # Replace with your Netlify domain
    allow_methods=["*"],
    allow_headers=["*"],
)


# Simulate data for 10 robots
robots = [
    {
        "id": str(uuid.uuid4()),
        "status": "Online",
        "battery": random.randint(20, 100),
        "cpu": random.randint(10, 100),
        "ram": random.randint(100, 16000),
        "last_updated": datetime.now().isoformat(),
        "location": [random.uniform(-90, 90), random.uniform(-180, 180)],
    }
    for _ in range(10)
]

@app.get("/robots")
async def get_robots():
    """Return the initial list of robots."""
    return robots

@app.websocket("/updates")
async def websocket_endpoint(websocket: WebSocket):
    """Send real-time updates to the frontend."""
    await websocket.accept()
    try:
        while True:
            for robot in robots:
                # Update robot telemetry data
                robot["battery"] = random.randint(10, 100)
                robot["cpu"] = random.randint(10, 100)
                robot["ram"] = random.randint(100, 16000)
                robot["status"] = "Offline" if robot["battery"] < 20 else "Online"
                robot["last_updated"] = datetime.now().isoformat()
                robot["location"] = [random.uniform(-90, 90), random.uniform(-180, 180)]
            await websocket.send_json(robots)
            await asyncio.sleep(5)  # Update every 5 seconds
    except Exception as e:
        print(f"WebSocket error: {e}")
