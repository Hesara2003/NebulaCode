import { io } from "socket.io-client";

const RUN_ID = process.env.RUN_ID ?? "demo-run";
const URL = process.env.URL ?? "http://127.0.0.1:4000";
const TOKEN = process.env.WS_TOKEN ?? "devtoken";

console.log("Connecting...", { URL, RUN_ID, hasToken: Boolean(TOKEN) });

const socket = io(`${URL}/runs`, {
  path: "/runs/socket.io",
  transports: ["websocket"],
  query: { runId: RUN_ID, token: TOKEN },
  auth: { token: TOKEN },
  timeout: 2000,
});

socket.on("connect", () => {
  console.log("connected", { id: socket.id, namespace: socket.nsp });
  socket.disconnect();
});

socket.on("connect_error", (err) => {
  console.error("connect_error", {
    message: err?.message,
    description: err?.description,
    context: err?.context,
    data: err?.data,
  });
  process.exitCode = 1;
});

socket.on("error", (err) => {
  console.error("socket error event", err);
});

setTimeout(() => {
  console.error("timeout waiting for connect");
  socket.disconnect();
  process.exit(2);
}, 2500);
