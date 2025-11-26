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
  cors: { origin: '*' },
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
  console.log("Execute request received:", payload);

  return client.emit("execute-response", {
    status: "OK",
    message: "Execute placeholder - not implemented yet",
  });
}

}
