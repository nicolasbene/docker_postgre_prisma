import { Logger, UseFilters, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
  WsResponse,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { BadRequestTransformationFilter } from '../utils/bad-request-exception.filter';

import { ChannelsService } from './channels.service';
import { CreateChannelDTO, JoinChannelDTO } from './chat.dto';
import { ChatEvent } from './chat.state';
import { UserService } from 'src/user/user.service';
import { JwtStrategy } from 'src/auth/strategy';
import { ConfigService } from '@nestjs/config';

// @UsePipes(new ValidationPipe())
@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000', // l'origine du message pour autoriser la connection
    credentials: true, // autoriser l'envoi de cookies
  },
  namespace: 'chat', // spécification pour éviter les conflits
})

@UseFilters(BadRequestTransformationFilter)
export class ChatGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  private io: Server;
  private logger: Logger = new Logger(ChatGateway.name);
  config: any;

  constructor(
    private jwtService: JwtService,
    private channelsService: ChannelsService,
    private userService: UserService,
    private jwtStrategy: JwtStrategy,
    private configService: ConfigService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('Initialized!');

    this.io.on('connection', (socket) => {
      this.logger.log('Client connected: ' + socket.id);
    });

    // setInterval(() => this.io.emit('message', 'hello'), 2000);
  }


  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
    const cookieName = this.configService.get('JWT_ACCESS_TOKEN_COOKIE'); // Récupérez le nom du cookie JWT à partir de la configuration
    const token = client.handshake.headers.cookie.split(`${cookieName}=`)[1]; // Récupérez le token JWT du cookie
    this.logger.log('Token: ' + token);
  
    if (token) {
      this.logger.log('Token: ' + token);
      const user = this.jwtService.decode(token); // Décoder le token
      client.data = { user }; // Attribuez l'utilisateur récupéré à partir du token
      this.logger.log('User data: ' + JSON.stringify(client.data.user));
    } else {
      this.logger.error('No token found in cookies.');
      // Gérez le cas où aucun token n'est trouvé dans les cookies
    }
  }

  
  @SubscribeMessage(ChatEvent.Create)
  async onCreateChannel(
    @MessageBody() channel: CreateChannelDTO,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const createdChannel = await this.channelsService.createChannel(channel, client.data.user);
      // Envoyer une réponse au client pour indiquer que le canal a été créé avec succès
      return { event: ChatEvent.Create, data: createdChannel };
    } catch (error) {
      // Gérer les erreurs et renvoyer une réponse appropriée au client
      throw new WsException('Failed to create channel');
    }
  }

  // @SubscribeMessage(ChatEvent.Join)
  // async onJoinChannel(@MessageBody() channel: JoinChannelDTO, @ConnectedSocket() client: Socket) {
  //   await this.channelsService.joinChannel(channel, client.data.user);
  //   //client.join(channel.channel);
  // }

  @SubscribeMessage(ChatEvent.Message)
  onMessage(@MessageBody() message: string): WsResponse<string> {
    return { event: ChatEvent.Message, data: 'You sent: ' + message };
  }
}