import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChannelsService } from './channels.service';
import { PrismaService } from 'nestjs-prisma';
import { UserService } from 'src/user/user.service';
import { ChatController } from './chat.controller';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ChatController],
  providers: [ChatGateway, ChannelsService, PrismaService, UserService],
})
export class ChatModule {}