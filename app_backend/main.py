from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from mcp_client import mcp_service

app = FastAPI(title="MCP Demo Backend")

# Allow React dev server
origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "MCP Demo Backend is running"}


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/tools")
async def list_tools():
    """
    List tools exposed by the MCP server.
    """
    tools = await mcp_service.list_tools()
    return {"tools": tools}


class CallToolRequest(BaseModel):
    name: str
    args: dict = {}


@app.post("/call-tool")
async def call_tool(payload: CallToolRequest):
    """
    Call a specific MCP tool with JSON args.
    """
    result = await mcp_service.call_tool(payload.name, payload.args)
    return result
