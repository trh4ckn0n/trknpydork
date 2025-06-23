import os
import json
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, Form
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, StreamingResponse
import httpx
import openai

openai.api_key = os.getenv("OPENAI_API_KEY")  # Assure-toi que la clé est dans l'env

app = FastAPI()
templates = Jinja2Templates(directory="templates")

async def fetch_url(client, url):
    try:
        r = await client.get(url, timeout=5)
        return r.status_code, len(r.text)
    except Exception:
        return None, None

async def scan_dork(client, dork):
    # Ici on simule une recherche google dork (en pratique faut une API custom)
    url = f"https://example.com/search?q={dork.replace(' ', '+')}"
    status, length = await fetch_url(client, url)
    return {
        "dork": dork,
        "url": url,
        "status": status or "timeout",
        "content_length": length or 0,
        "risk": "Low" if "php" in dork else "Medium",
        "country": ".fr"
    }

async def generate_dorks_openai(prompt):
    response = await openai.ChatCompletion.acreate(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Tu es un expert en sécurité informatique, crée une liste de dorks efficaces et variés."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=150,
        temperature=0.8,
        n=1
    )
    text = response.choices[0].message.content
    # On suppose une liste en lignes, on filtre un peu
    dorks = [line.strip("-* \n\t") for line in text.split("\n") if line.strip()]
    return dorks

@app.get("/", response_class=HTMLResponse)
async def get(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.websocket("/ws/scan")
async def websocket_scan(websocket: WebSocket):
    await websocket.accept()
    try:
        data = await websocket.receive_text()
        obj = json.loads(data)
        dorks = obj.get("dorks", [])
        async with httpx.AsyncClient() as client:
            for dork in dorks:
                result = await scan_dork(client, dork)
                await websocket.send_text(json.dumps(result))
        await websocket.close()
    except WebSocketDisconnect:
        print("Client disconnected")

@app.websocket("/ws/generate_dorks")
async def websocket_generate_dorks(websocket: WebSocket):
    await websocket.accept()
    try:
        prompt = await websocket.receive_text()
        dorks = await generate_dorks_openai(prompt)
        await websocket.send_text(json.dumps(dorks))
        await websocket.close()
    except WebSocketDisconnect:
        print("Client disconnected")
