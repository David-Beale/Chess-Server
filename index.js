const { Server } = require("socket.io");
const crypto = require("crypto");

const io = new Server(4000, {
  cors: {
    origin: "http://localhost:3000",
  },
});

const activeGames = {};
const randomId = () => {
  let gameId;
  do {
    gameId = crypto.randomBytes(4).toString("hex");
  } while (activeGames[gameId]);

  return gameId;
};
const flipColor = (color) => {
  return color === "white" ? "black" : "white";
};
io.on("connection", (socket) => {
  socket.on("new game", (color) => {
    if (socket.gameId) {
      delete activeGames[socket.gameId];
    }
    const gameId = randomId();
    socket.gameId = gameId;
    socket.join(gameId);
    socket.color = color;
    activeGames[gameId] = { player1Color: color, players: 1, turn: "white" };
    io.to(gameId).emit("game id", gameId);
  });

  socket.on("join game", (gameId) => {
    socket.gameId = gameId;
    socket.join(gameId);
    if (!activeGames[gameId] || activeGames[gameId].players === 2) {
      io.to(gameId).emit("error joining game");
      return;
    }
    activeGames[gameId].players++;
    const { player1Color } = activeGames[gameId];
    const color = flipColor(player1Color);
    socket.color = color;
    io.to(gameId).emit("player connected", color);
  });

  socket.on("move", (payload) => {
    const { gameId } = socket;
    const { turn } = activeGames[gameId];
    if (socket.color !== turn) return;
    activeGames[gameId].turn = flipColor(activeGames[gameId].turn);

    socket.to(gameId).emit("move", payload);
  });

  socket.on("disconnect", () => {
    const { gameId } = socket;
    if (activeGames[gameId]) {
      activeGames[gameId].players--;
      if (!activeGames[gameId].players) delete activeGames[gameId];
      else socket.to(gameId).emit("player disconnected");
    }
  });
});
