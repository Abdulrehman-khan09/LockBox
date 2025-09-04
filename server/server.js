const app = require("./app");
const Port = process.env.PORT;
const http = require("http");
const server = http.createServer(app);
const {initializeSocket} = require("./socket");
const { Server } = require("socket.io");


const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    credentials: true,
  },
});

initializeSocket(io);

server.listen(Port, () => {
    console.log(`Server is running on port ${Port}`);
})

