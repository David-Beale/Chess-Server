const crypto = require("crypto");

class GameManager {
  constructor() {
    this.activeGames = {};
  }

  randomId() {
    let gameId;
    do {
      gameId = crypto.randomBytes(4).toString("hex");
    } while (this.activeGames[gameId]);

    return gameId;
  }
  flipColor(color) {
    return color === "white" ? "black" : "white";
  }
  newGame(color) {
    const gameId = this.randomId();
    this.activeGames[gameId] = {
      player1Color: color,
      players: 1,
      turn: "white",
    };
    return gameId;
  }
  removeGame(id) {
    delete this.activeGames[id];
  }
  checkForGame(gameId) {
    const game = this.activeGames[gameId];
    const isAvailable = game && game.players === 1;
    if (!isAvailable) return { error: true };
    game.players++;
    const { player1Color } = game;
    const color = this.flipColor(player1Color);
    return { color };
  }
  updateTurn(gameId, color) {
    const game = this.activeGames[gameId];
    const { turn } = game;
    if (color !== turn) return { error: true };
    game.turn = this.flipColor(game.turn);
    return { error: false };
  }
  disconnect(gameId) {
    delete this.activeGames[gameId];
  }
}

module.exports = GameManager;
