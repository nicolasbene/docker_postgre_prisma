import { Socket } from 'socket.io';
import { PrismaService } from 'nestjs-prisma';
import { GameService, GameStateSend } from './game.service';
import { ChannelRole, ChannelType, Prisma, User, Game } from '@prisma/client';


export class GameRoom {
    private player1: Socket;
    private idPlayer1:number;
    private idPlayer2:number;
    private player2: Socket;
    private gameService: GameService;
    private gameLoopInterval: NodeJS.Timeout | null = null;
    private updateInterval = 1000 / 50;
    private prisma: PrismaService;
  
    constructor(player1: Socket, player2: Socket, idPlayer1: number, idPlayer2: number, prisma: PrismaService) {
      this.player1 = player1;
      this.idPlayer1 = idPlayer1;
      this.idPlayer2 = idPlayer2;
      this.player2 = player2;
      this.gameService = new GameService();
      this.gameService.resetGameState();
      this.prisma = prisma; // Assign prisma here
    }

    async createGame(IDwinner: number, IDloser: number, scoreWinner: number, scoreLoser: number): Promise<void> {
      await this.prisma.game.create({
        data: {
          winnerScore: scoreWinner,
          loserScore: scoreLoser,
          winner: {
            connect: { id: IDwinner } // Connectez l'utilisateur gagnant par son ID
          },
          loser: {
            connect: { id: IDloser } // Connectez l'utilisateur perdant par son ID
          }
        },
      });
    }

  async sendGameHistory(gameState: GameStateSend, player1ID: number, player2ID: number): Promise<void> {
    if (gameState.score.scoreU1 > gameState.score.scoreU2) {
      this.createGame(player1ID, player2ID, gameState.score.scoreU1, gameState.score.scoreU2);
    }
    else {
      this.createGame(player2ID, player1ID, gameState.score.scoreU2, gameState.score.scoreU1);
    }
  }

  startGameLoop(): void {
    // console.log("startloop");
    const player1ID : number = this.idPlayer1;
    const player2ID : number = this.idPlayer2;
    // console.log(player1ID, player2ID);
    this.gameLoopInterval = setInterval(() => {
      this.gameService.updateGameState();
      const gameState1 = this.gameService.broadcastGameState(1);
      const gameState2 = this.gameService.broadcastGameState(2);

      if (gameState1.score.scoreU1 >= 11 || gameState1.score.scoreU2 >= 11) {
        this.sendGameHistory(gameState1, player1ID, player2ID);
        this.player1.emit('game-finish', gameState1);
        this.player2.emit('game-finish', gameState2);
        // a faire envoie les donne de fin de partie a prisma pour le game history
        // this.createGame(1, 2, gameState1.score.scoreU1, gameState1.score.scoreU2);
        clearInterval(this.gameLoopInterval);
      }
      else {
        this.player1.emit('game-state', gameState1);
        this.player2.emit('game-state', gameState2);
      }
    }, this.updateInterval);
  }

  stopGameLoop(): void {
    // console.log("endloop");
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
      this.gameLoopInterval = null;
    }
  }

  updatePaddlePosition( y: number, x: number) {
    if (x === 0) {
      this.gameService.updateUserPaddle(y);
    } else {
      this.gameService.updateUserPaddle2(y);
    }
  }

  notifyPlayerOfDisconnect(client : Socket) {
    if (this.player1 === client) {
      this.player2.emit('player-left-game');
    }else if (this.player2 === client) {
      this.player1.emit('player-left-game');
    }
  }

  includesPlayer(client : Socket) : boolean {
    if (client === this.player1 || client === this.player2)
      return (true);
    return (false);
  }

  deletePlayerInRoom(client : Socket) {
    if (client === this.player1)
      this.player1 = null;
    if (client === this.player2)
      this.player2 = null;
  }
}