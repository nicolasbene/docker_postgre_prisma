// my.gateway.ts
import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameRoom } from './room.service';
import { UserService } from 'src/user/user.service';
import { JwtStrategy } from 'src/auth/strategy';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
	Logger,
	UseFilters,
	UseGuards,
	UsePipes,
	ValidationPipe,
} from '@nestjs/common';

@WebSocketGateway({
    cors: {
        origin : 'http://localhost:3000',//mettre une variable pour pouvoir modifie en temp reel
        credentials: true,//pour accepter l'envoi de cookies
      },
    namespace: 'game',//specification pour pas que sa rentre en conflit
})
export class GameGateway {
    @WebSocketServer()
    server: Server;

    private waitingPlayers: { client: Socket, username: string }[] = [];
    private gameRooms: Map<string, GameRoom> = new Map();
    private logger: Logger = new Logger(GameGateway.name);
    
    constructor(
      private jwtService: JwtService,
      private userService: UserService,
      private jwtStrategy: JwtStrategy,
      private configService: ConfigService,
    ) {}

    async handleConnection(client: Socket, ...args: any[]) {
      try {
        this.logger.log(`Client connected: ${client.id}`);
        const cookieName = this.configService.get('JWT_ACCESS_TOKEN_COOKIE'); // Récupérez le nom du cookie JWT à partir de la configuration
        const token = client.handshake.headers.cookie.split(`${cookieName}=`)[1]; // Récupérez le token JWT du cookie
  
        if (token) {
          this.logger.log('Token: ' + token);
          const payload = this.jwtService.decode(token); // Décoder le token\
          this.logger.log("Payload: " + JSON.stringify(payload));
          client.data.user = await this.userService.getUnique(payload.sub); // Récupérez l'utilisateur à partir de la base de données
          //   this.logger.log("User attache au socket " + client.data.user.id);
        } else {
          this.logger.error('No token found in cookies.');
          // Gérez le cas où aucun token n'est trouvé dans les cookies
        }
  
        const username = client.data.user.username;
        const existingSockets = this.socketsID.get(username) || [];
        existingSockets.push(client);
        this.socketsID.set(username, existingSockets);
  
        const channels = await this.channelsService.getJoinedChannels(client.data.user);
        const channelsName = channels.map((c) => c.name);
        client.join(channelsName);
      } catch (error) {
        // Gérer les erreurs et renvoyer une réponse appropriée au client
        throw new WsException('Failed to handle connection');
      }
    }
  

    deleteplayerInWaitList(client: Socket) {
      this.waitingPlayers = this.waitingPlayers.filter(player => player.client.id !== client.id);
    }
  
    handleDisconnect(@ConnectedSocket() client: Socket) {
      // Identifier la salle de jeu du joueur déconnecté
      let roomId: string | null = null;
      this.deleteplayerInWaitList(client);
      this.gameRooms.forEach((room, id) => {
        if (room.includesPlayer(client)) {
          roomId = id;
        }
      });
  
      if (roomId) {
        const gameRoom = this.gameRooms.get(roomId);
        if (gameRoom) {
          // Informer l'autre joueur de la déconnexion
          gameRoom.notifyPlayerOfDisconnect(client);
          // Supprimer la salle de jeu
          gameRoom.stopGameLoop();
          this.gameRooms.delete(roomId);
        }
      }
    }

    @SubscribeMessage('client-disconnect')
    handleClientDisconnect(@ConnectedSocket() client: Socket) {
      this.handleDisconnect(client);
    }
  
    @SubscribeMessage('join')
    handleJoin(@ConnectedSocket() client: Socket, 
    @MessageBody() data: { username: string}) {
      console.log("username:", data.username);
      this.waitingPlayers.push({ client, username: data.username });
  
      if (this.waitingPlayers.length >= 2) {
        const player1 = this.waitingPlayers.shift();
        const player2 = this.waitingPlayers.shift();
  
        if (player1 && player2) {
          const roomID = this.createRoomID(player1.client, player2.client);
          const gameRoom = new GameRoom(player1.client, player2.client);
          this.gameRooms.set(roomID, gameRoom);
  
          console.log("username1:", player1.username);
          console.log("username2:", player2.username);
          // Informer les joueurs de l'ID de la salle
          // username indefini donc peut etre definir la classe player avec un socket et un username
          player1.client.emit('room-id', {roomID : roomID, NumPlayer : 1, playerName1: player1.username, playerName2: player2.username});
          player2.client.emit('room-id', {roomID : roomID, NumPlayer : 2, playerName1: player1.username, playerName2: player2.username});
          gameRoom.startGameLoop();
        }
      }
    }

    private createRoomID(player1: Socket, player2: Socket): string {
      return `room-${Date.now()}-${player1.id}-${player2.id}`;
    }

    @SubscribeMessage('user-paddle-move')
    handlePaddleMove( 
      @MessageBody() data: { y: number, roomId: string, x: number }
    ) {
      const roomId = data.roomId;
      const gameRoom = this.gameRooms.get(roomId);
    
      if (gameRoom) {
        gameRoom.updatePaddlePosition(data.y, data.x);
      }
    }
    
    @SubscribeMessage('finish')
    handleFinish(@ConnectedSocket() client: Socket) {
      let roomId: string | null = null;
      this.deleteplayerInWaitList(client);
      this.gameRooms.forEach((room, id) => {
        if (room.includesPlayer(client)) {
          roomId = id;
        }
      });
  
      if (roomId) {
        const gameRoom = this.gameRooms.get(roomId);
        if (gameRoom) {
          //peut etre notifie les deux joueur que la partie est terminer????
          // Supprimer la salle de jeu
          gameRoom.stopGameLoop();
          this.gameRooms.delete(roomId);
        }
      }
    }
}