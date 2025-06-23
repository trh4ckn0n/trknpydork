from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect, BackgroundTasks, Form
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
import asyncio
import json

app = FastAPI()
templates = Jinja2Templates(directory="templates")

clients = set()

@app.get("/", response_class=HTMLResponse)
async def get(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

async def simulate_scan(dorks, websocket: WebSocket):
    for dork in dorks:
        # Simule une recherche lente
        await asyncio.sleep(1)
        result = {
            "dork": dork,
            "url": f"https://example.com/search?q={dork.replace(' ', '+')}",
            "risk": "Low" if "php" in dork else "Medium",
            "country": ".fr"
        }
        await websocket.send_text(json.dumps(result))

@app.websocket("/ws/scan")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        data = await websocket.receive_text()
        obj = json.loads(data)
        dorks = obj.get("dorks", [])
        await simulate_scan(dorks, websocket)
    except WebSocketDisconnect:
        print("Client disconnected")
