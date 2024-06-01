"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const redis_1 = require("redis");
const ws_1 = require("ws");
const app = (0, express_1.default)();
app.use(express_1.default.json());
const client = (0, redis_1.createClient)();
client.on("error", (error) => {
    console.error("Error connecting to Redis:", error);
});
const httpServer = app.listen(8080, () => {
    console.log("HTTP server started on http://localhost:8080");
});
// WebSocket server
const wss = new ws_1.WebSocketServer({ noServer: true });
const connectedUsers = {};
// Handle WebSocket connections
wss.on("connection", (ws, userId) => {
    connectedUsers[userId] = ws;
    ws.send(JSON.stringify({ message: "Connected" }));
    ws.on("close", () => {
        delete connectedUsers[userId];
    });
});
// Handle Redis pub/sub messages
function handleRedisMessages() {
    return __awaiter(this, void 0, void 0, function* () {
        const subscriber = client.duplicate();
        yield subscriber.connect();
        yield subscriber.subscribe("submission_responses", (message) => {
            const data = JSON.parse(message);
            const userId = data.userId;
            const response = data.response;
            if (connectedUsers[userId]) {
                connectedUsers[userId].send(JSON.stringify({ response }));
            }
        });
    });
}
handleRedisMessages().catch(console.error);
// Upgrade HTTP to WebSocket
httpServer.on("upgrade", (request, socket, head) => {
    var _a;
    const urlParams = new URLSearchParams((_a = request.url) === null || _a === void 0 ? void 0 : _a.split("?")[1]);
    const userId = urlParams.get("userId");
    if (userId) {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit("connection", ws, userId);
        });
    }
    else {
        socket.destroy();
    }
});
app.post("/submit", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { problemId, userId, code } = req.body;
        // Push the submission to the Redis queue
        yield client.rPush("submissions", JSON.stringify({ problemId, userId, code }));
        // Create WebSocket connection for the user
        const wsUrl = `ws://localhost:8080/?userId=${userId}`;
        res.json({ status: "success", wsUrl });
    }
    catch (error) {
        console.error("Error while submitting code:", error);
        res.json({ status: "error" });
    }
}));
// Connect to Redis and start the server
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield client.connect();
            console.log("Connected to Redis");
        }
        catch (error) {
            console.error("Error while connecting to Redis:", error);
        }
    });
}
startServer();
