from typing import List, Literal

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from langchain_core.messages import HumanMessage, AIMessage
from graph import graph_app



# ---------- 1. Pydantic models for API ----------

RoleType = Literal["user", "assistant"]


class ChatMessage(BaseModel):
    role: RoleType
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]


class ChatResponse(BaseModel):
    messages: List[ChatMessage]


# ---------- 2. FastAPI app ----------

app = FastAPI(title="LangGraph Research Assistant (Ollama)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],   # or ["POST", "OPTIONS"]
    allow_headers=["*"],
)

# ---------- 3. Conversion helpers ----------

def to_lc_messages(msgs: List[ChatMessage]):
    """Convert API messages to LangChain messages."""
    lc_msgs = []
    for m in msgs:
        if m.role == "user":
            lc_msgs.append(HumanMessage(content=m.content))
        else:
            lc_msgs.append(AIMessage(content=m.content))
    return lc_msgs


def from_lc_messages(lc_msgs) -> List[ChatMessage]:
    """Convert LangChain messages back to API format."""
    out: List[ChatMessage] = []
    for m in lc_msgs:
        if isinstance(m, HumanMessage):
            role: RoleType = "user"
        else:
            role = "assistant"
        out.append(ChatMessage(role=role, content=str(m.content)))
    return out


# ---------- 4. Chat endpoint ----------

@app.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    # Convert to LangChain messages and call LangGraph
    lc_msgs = to_lc_messages(request.messages)

    # Extract latest user question as `query`
    last_user = next(
        (m for m in reversed(request.messages) if m.role == "user"),
        None,
    )
    query_text = last_user.content if last_user else ""

    # Invoke graph with full state
    result_state = graph_app.invoke(
        {
            "messages": lc_msgs,
            "query": query_text,
            "context": [],
        }
    )

    # Convert back to API messages
    result_msgs = from_lc_messages(result_state["messages"])
    return ChatResponse(messages=result_msgs)
