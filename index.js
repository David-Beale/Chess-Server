const { Server } = require("socket.io");
const GameManager = require("./GameManager");
const games = new GameManager();

const io = new Server(process.env.PORT || 5000, {
  cors: {
    origin: "https://david-beale.github.io",
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
      socket.emit("error joining game");
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
    const gameId = socket.gameId;
    games.disconnect(gameId);
    socket.to(gameId).emit("player disconnected", socket.id);
  });
});
