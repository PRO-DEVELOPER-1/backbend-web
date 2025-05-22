import os
import secrets
import requests
import subprocess
import shutil
from datetime import datetime
from fastapi import FastAPI, HTTPException, Request, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client
from slowapi import Limiter
from slowapi.util import get_remote_address

# Initialize app
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# Rate limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

# Configuration
FLY_API_TOKEN = os.getenv("FLY_API_TOKEN")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
BUILDER_IMAGE = "heroku/builder:22"
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Models
class AppCreate(BaseModel):
    git_url: str

class ScaleRequest(BaseModel):
    instances: int = 1

# Helpers
def cleanup_old_apps():
    """Keep only 3 latest apps (Fly.io free tier limit)"""
    apps = supabase.table("apps").select("*").execute().data
    if len(apps) > 2:
        oldest = sorted(apps, key=lambda x: x['created_at'])[0]
        requests.delete(
            f"https://api.fly.io/v1/apps/{oldest['fly_name']}",
            headers={"Authorization": f"Bearer {FLY_API_TOKEN}"}
        )
        supabase.table("apps").delete().eq("id", oldest['id']).execute()

def detect_buildpack(git_url: str):
    """Detect language from repository"""
    temp_dir = f"/tmp/{secrets.token_hex(4)}"
    try:
        subprocess.run(["git", "clone", git_url, temp_dir], check=True)
        if os.path.exists(f"{temp_dir}/package.json"): return "nodejs"
        if os.path.exists(f"{temp_dir}/requirements.txt"): return "python"
        if os.path.exists(f"{temp_dir}/Gemfile"): return "ruby"
        return "docker"
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

def build_deploy(fly_name: str, git_url: str, buildpack: str):
    """Build and deploy using Heroku buildpacks"""
    temp_dir = f"/tmp/{secrets.token_hex(4)}"
    try:
        subprocess.run(["git", "clone", git_url, temp_dir], check=True)
        if buildpack != "docker":
            subprocess.run([
                "pack", "build", fly_name,
                "--builder", BUILDER_IMAGE,
                "--path", temp_dir,
                "--buildpack", f"heroku/{buildpack}"
            ], check=True)
        subprocess.run([
            "flyctl", "deploy", fly_name,
            "--remote-only",
            "--dockerfile", f"{temp_dir}/Dockerfile" if buildpack == "docker" else "auto"
        ], check=True)
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

# Routes
@app.post("/apps")
@limiter.limit("100/hour")
async def create_app(request: AppCreate, req: Request):
    cleanup_old_apps()
    app_id = secrets.token_hex(4)
    fly_name = f"bera-{app_id}"
    buildpack = detect_buildpack(request.git_url)
    
    try:
        # Create Fly.io app
        requests.post(
            "https://api.fly.io/v1/apps",
            headers={"Authorization": f"Bearer {FLY_API_TOKEN}"},
            json={"name": fly_name, "org": "personal"}
        )
        
        # Build and deploy
        build_deploy(fly_name, request.git_url, buildpack)
        
        # Store metadata
        supabase.table("apps").insert({
            "id": app_id,
            "fly_name": fly_name,
            "git_url": request.git_url,
            "status": "active",
            "buildpack": buildpack,
            "created_at": datetime.now().isoformat()
        }).execute()
        
        return {"id": app_id, "url": f"https://{fly_name}.fly.dev"}
    
    except Exception as e:
        raise HTTPException(500, str(e))

@app.websocket("/apps/{app_id}/logs")
async def websocket_logs(websocket: WebSocket, app_id: str):
    await websocket.accept()
    app = supabase.table("apps").select("*").eq("id", app_id).single().execute()
    
    try:
        logs = subprocess.Popen(
            ["flyctl", "logs", "-a", app.data["fly_name"]],
            stdout=subprocess.PIPE,
            universal_newlines=True
        )
        while True:
            line = logs.stdout.readline()
            if not line: break
            await websocket.send_text(line)
            
    except Exception as e:
        await websocket.close(code=1011)

@app.get("/apps")
async def list_apps():
    return supabase.table("apps").select("*").execute().data

@app.post("/apps/{app_id}/scale")
async def scale_app(app_id: str, request: ScaleRequest):
    app = supabase.table("apps").select("*").eq("id", app_id).single().execute()
    requests.post(
        f"https://api.fly.io/v1/apps/{app.data['fly_name']}/scale",
        headers={"Authorization": f"Bearer {FLY_API_TOKEN}"},
        json={"count": request.instances}
    )
    return {"status": "scaling"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
