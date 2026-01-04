import {
  WebSocketGateway,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';

@WebSocketGateway({
  namespace: 'terminal',
  cors: {
    origin: [
      ...(process.env.COLLAB_ALLOWED_ORIGINS?.split(',')
        .map((value) => value.trim())
        .filter((value) => value.length > 0) ?? []),
      /localhost:\d+$/,
      /^http:\/\/127\.0\.0\.1:\d+$/,
    ],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  afterInit() {
    console.log('WebSocket Gateway Initialized');
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  // Echo handler
  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() text: string,
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`Received message from ${client.id}: ${text}`);
    client.emit('message', text); // Echo back
  }

  // Execute handler (placeholder)
  @SubscribeMessage('execute')
  handleExecute(
    @MessageBody() payload: any,
    @ConnectedSocket() client: Socket,
  ) {
    console.log('Execute request received:', payload);

    return client.emit('execute-response', {
      status: 'OK',
      message: 'Execute placeholder - not implemented yet',
    });
  }
}
