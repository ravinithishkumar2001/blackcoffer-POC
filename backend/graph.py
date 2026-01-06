from typing import Annotated, TypedDict, List

from langchain_ollama import ChatOllama
from langchain_core.messages import AIMessage, HumanMessage, BaseMessage
from langgraph.graph import StateGraph, END, START
from langgraph.graph.message import add_messages


# ---------- 1. State ----------

class AgentState(TypedDict):
    # Chat history
    messages: Annotated[List[BaseMessage], add_messages]
    # Current user query
    query: str
    # Retrieved context snippets
    context: List[str]


# ---------- 2. LLM (Ollama) ----------

# Change model name if needed, e.g. "llama3.1:8b" or any local model you pulled.
llm = ChatOllama(
    model="llama3",
    base_url="http://localhost:11434",
    temperature=0.4,
)


# ---------- 3. Router node ----------

def router_node(state: AgentState) -> AgentState:
    query = state["query"]
    # Very naive heuristic to decide if we need "research mode"
    needs_research = len(query) > 80 or any(
        kw in query.lower()
        for kw in ["explain", "compare", "difference", "advantages", "disadvantages", "research"]
    )

    # Reset context and add a marker (used by route_after_router)
    state["context"] = []
    if needs_research:
        state["context"].append("[ROUTER] research_mode")
    else:
        state["context"].append("[ROUTER] simple_mode")

    return state


# ---------- 4. Simple local retriever node ----------

# Placeholder local knowledge base; replace with vector DB/doc loader later.
LOCAL_SNIPPETS = [
    "LangGraph lets you define LLM workflows as graphs with nodes and edges.",
    "LangGraph supports persistent memory and checkpointers to resume long-running agents.",
    "Ollama runs LLMs locally and integrates with LangChain via the ChatOllama class.",
    "Research assistants often use Retrieval Augmented Generation (RAG) to answer questions from documents.",
    "LangGraph is well-suited for agentic RAG because it can coordinate retrieval, reasoning, and post-processing steps.",
]


def retrieve_node(state: AgentState) -> AgentState:
    query = state["query"].lower()
    matched: List[str] = []

    # Very naive keyword matching over first few tokens of the query
    first_tokens = query.split()[:5]
    for text in LOCAL_SNIPPETS:
        if any(tok in text.lower() for tok in first_tokens):
            matched.append(text)

    # Fallback: use all snippets if nothing matched
    if not matched:
        matched = LOCAL_SNIPPETS

    state["context"] = matched
    return state


# ---------- 5. Agent (RAG-style generation) node ----------

def agent_node(state: AgentState) -> AgentState:
    query = state["query"]
    context = state["context"]

    system_prompt = (
        "You are a helpful research assistant. "
        "Use the context snippets below to answer the question. "
        "If the context is insufficient, say so and answer best-effort.\n\n"
        "Context:\n"
        + "\n".join(f"- {c}" for c in context)
        + "\n"
    )

    # Build a single-turn prompt combining system-style instructions and the question
    prompt = system_prompt + f"\nQuestion: {query}\nAnswer:"

    # Call the local LLM via Ollama
    response = llm.invoke([HumanMessage(content=prompt)])

    # Append to conversation history: user query + assistant answer
    new_messages = state["messages"] + [
        HumanMessage(content=query),
        response,
    ]

    return {
        "messages": new_messages,
        "query": query,
        "context": context,
    }


# ---------- 6. Conditional routing ----------

def route_after_router(state: AgentState) -> str:
    """Decide next node after router based on the marker in context."""
    markers = state.get("context", [])
    if any("research_mode" in m for m in markers):
        return "retrieve"
    return "agent"


# ---------- 7. Build & compile graph ----------

def build_graph():
    workflow = StateGraph(AgentState)

    workflow.add_node("router", router_node)
    workflow.add_node("retrieve", retrieve_node)
    workflow.add_node("agent", agent_node)

    workflow.add_edge(START, "router")
    workflow.add_conditional_edges("router", route_after_router)
    workflow.add_edge("retrieve", "agent")
    workflow.add_edge("agent", END)

    return workflow.compile()


graph_app = build_graph()
