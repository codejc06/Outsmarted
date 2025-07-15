// public/matchmaking.js
import socket from "/socket.js";

// Connect only once
if (!socket.connected) {
  socket.connect();
  console.log("Connecting to server...");
}

socket.on("connect", () => {
  console.log("Connected with ID:", socket.id);
});

socket.on("roomJoined", (url) => {
  console.log("Matched! Redirecting to:", url);
  window.location.href = url;
});

// Optional: Handle timeout or waiting display
socket.on("waiting", () => {
  console.log("Waiting for another player...");
});
