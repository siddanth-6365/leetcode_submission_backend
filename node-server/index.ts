import express, { Request, Response } from "express";
import { createClient } from "redis";
import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import cors from "cors"

const app = express();
app.use(express.json());
app.use(cors())

const client = createClient();
client.on("error", (error: Error) => {
  console.error("Error connecting to Redis:", error);
});

const httpServer = app.listen(8080, () => {
  console.log("HTTP server started on http://localhost:8080");
});

// WebSocket server
const wss = new WebSocketServer({ noServer: true });

interface ConnectedUsers {
  [key: string]: WebSocket;
}

const connectedUsers: ConnectedUsers = {};

// Handle WebSocket connections
wss.on("connection", (ws: WebSocket, userId: string) => {
  connectedUsers[userId] = ws;
  ws.send(JSON.stringify({ message: "Connected" }));

  ws.on("close", () => {
    delete connectedUsers[userId];
  });
});

// Handle Redis pub/sub messages
async function handleRedisMessages() {
  const subscriber = client.duplicate();
  await subscriber.connect();
  await subscriber.subscribe("submission_responses", (message: string) => {
    const data = JSON.parse(message);
    const userId: string = data.userId;
    const response = data.response;

    if (connectedUsers[userId]) {
      connectedUsers[userId].send(JSON.stringify({ response }));
    }
  });
}

handleRedisMessages().catch(console.error);

// Upgrade HTTP to WebSocket
httpServer.on("upgrade", (request: IncomingMessage, socket: any, head: any) => {
  const urlParams = new URLSearchParams(request.url?.split("?")[1]);
  const userId = urlParams.get("userId");

  if (userId) {
    wss.handleUpgrade(request, socket, head, (ws: WebSocket) => {
      wss.emit("connection", ws, userId);
    });
  } else {
    socket.destroy();
  }
});

app.post("/submit", async (req: Request, res: Response) => {
  try {
    const { problemId, userId, code } = req.body;

    // Push the submission to the Redis queue
    await client.rPush(
      "submissions",
      JSON.stringify({ problemId, userId, code })
    );

    // Create WebSocket connection for the user
    const wsUrl = `ws://localhost:8080/?userId=${userId}`;
    res.json({ status: "success", wsUrl });
  } catch (error) {
    console.error("Error while submitting code:", error);
    res.json({ status: "error" });
  }
});

// Connect to Redis and start the server
async function startServer() {
  try {
    await client.connect();
    console.log("Connected to Redis");
  } catch (error) {
    console.error("Error while connecting to Redis:", error);
  }
}

startServer();
