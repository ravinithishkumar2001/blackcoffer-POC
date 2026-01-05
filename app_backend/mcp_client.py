from fastmcp import Client

MCP_SERVER_PATH = "../mcp_server/server.py"


class MCPService:
    """
    Thin wrapper around FastMCP Client to talk to our local MCP server.
    """

    def __init__(self, server_path: str = MCP_SERVER_PATH):
        self.server_path = server_path

    async def list_tools(self):
        async with Client(self.server_path) as client:
            tools = await client.list_tools()
            # Tool objects should be Pydantic models → use dict() for compatibility
            return [t.dict() if hasattr(t, "dict") else t for t in tools]

    async def call_tool(self, name: str, args: dict):
        async with Client(self.server_path) as client:
            result = await client.call_tool(name, args)
            # Try to retrieve a text representation if present, else raw data
            text = getattr(result, "text", None)
            data = getattr(result, "data", None)
            return {
                "text": text,
                "data": data,
            }


mcp_service = MCPService()
