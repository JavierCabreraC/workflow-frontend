import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { environment } from '../../../environments/environment';

interface PendingSub {
  topic: string;
  callback: (msg: IMessage) => void;
}

@Injectable({ providedIn: 'root' })
export class WebsocketService {
  private client!: Client;
  private pending: PendingSub[] = [];

  connect(): void {
    this.client = new Client({
      webSocketFactory: () => new SockJS(environment.wsUrl) as WebSocket,
      reconnectDelay: 5000,
      onConnect: () => {
        this.pending.forEach(s => this.client.subscribe(s.topic, s.callback));
        this.pending = [];
      },
    });
    this.client.activate();
  }

  disconnect(): void {
    this.client?.deactivate();
  }

  subscribe(topic: string, callback: (msg: IMessage) => void): void {
    if (this.client?.connected) {
      this.client.subscribe(topic, callback);
    } else {
      this.pending.push({ topic, callback });
    }
  }

  publish(destination: string, body: string): void {
    if (this.client?.connected) {
      this.client.publish({ destination, body });
    }
  }

  isConnected(): boolean {
    return this.client?.connected ?? false;
  }
}
