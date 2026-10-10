require("dotenv").config({ override: true });
const http = require("http");
const app = require("./app");
const connectDB = require("./config/db.js");
const { initLiveClassSocket } = require("./sockets/liveClassSocket");
const { restoreActiveTimers } = require("./sockets/classroomLifecycle");

console.log(process.env.MONGO_URI);
connectDB().then(() => {
  restoreActiveTimers();
});

const server = http.createServer(app);
initLiveClassSocket(server);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server & Socket.IO listening on port:${PORT}`);
});