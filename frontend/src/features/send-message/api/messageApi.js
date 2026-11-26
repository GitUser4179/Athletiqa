import * as signalR from "@microsoft/signalr";

const API_BASE = import.meta.env.VITE_API_URL || '';

// Shared connection instance
let connection = null;

// Builds the connection object if it doesn't exist yet, but doesn't open it.
export function getConnection() {
  if (!connection) {
    connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE}/hubs/conversation`, {
        withCredentials: true, // Sends cookies/auth headers so the backend knows who you are
      })
      .withAutomaticReconnect() // Auto reconnect if the connection drops
      .build();
  }
  return connection;
}

// The in-flight start, shared so concurrent callers all wait for the same connection
let startPromise = null;

// Opens the websocket connection to the backend hub.
// Several effects call this at the same time when the chat opens; without the shared promise the
// second caller would get a still-connecting connection and its JoinConversation call would fail,
// so live messages never arrived.
export async function startConnection() {
  const conn = getConnection();
  if (conn.state === signalR.HubConnectionState.Connected) return conn;

  if (!startPromise) {
    startPromise = conn.start().finally(() => {
      startPromise = null;
    });
  }
  await startPromise;
  return conn;
}

// Calls send message on the backend hub
// Backend derives sender/receiver from the logged-in user using cookie auth
// so we only need to pass the conversation and content (at request of slava)
export async function sendMessage(conversationId, content) {
  const conn = getConnection();
  await conn.invoke("SendMessage", conversationId, content );
}

// Registers a callback when backend pushes a receiveMessage event
export async function onReceiveMessage(callback) {
  const conn = getConnection();
  conn.on("ReceiveMessage", callback);
}

// Removes the listener to avoid stacking duplicates
export async function offReceiveMessage(callback) {
  const conn = getConnection();
  conn.off("ReceiveMessage", callback);
}
