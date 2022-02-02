const { Server } = require("socket.io");
const GameManager = require("./GameManager");
const games = new GameManager();

const io = new Server(4000, {
  cors: {
    origin: "http://localhost:3000",
  },
});

io.on("connection", (socket) => {
  socket.on("new game", (color) => {
    if (socket.gameId) {
      games.removeGame(socket.gameId);
    }
    const gameId = games.newGame(color);
    socket.gameId = gameId;
    socket.join(gameId);
    socket.color = color;
    io.to(gameId).emit("game id", gameId);
  });

  socket.on("join game", (gameId) => {
    const { error, color } = games.checkForGame(gameId);
    if (error) {
      io.to(gameId).emit("error joining game");
      return;
    }

    socket.join(gameId);
    socket.gameId = gameId;
    socket.color = color;
    io.to(gameId).emit("player connected", color);
  });

  socket.on("move", (payload) => {
    const { gameId, color } = socket;
    const { error } = games.updateTurn(gameId, color);
    if (error) return;

    socket.to(gameId).emit("move", payload);
  });

  socket.on("disconnect", () => {
    console.log("disconnect");
    const gameId = socket.gameId;
    games.disconnect(gameId);
    socket.to(gameId).emit("player disconnected", socket.id);
  });
  socket.on("leave", () => {
    console.log("leave");
    const gameId = socket.gameId;
    socket.gameId = null;
    socket.leave(gameId);
    games.disconnect(socket.gameId);
    socket.to(gameId).emit("player disconnected", socket.id);
  });
});
