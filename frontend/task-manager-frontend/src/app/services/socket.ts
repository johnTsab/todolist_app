import { Injectable } from '@angular/core';
import {io,Socket} from 'socket.io-client';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket! : Socket; 

  connect(userId: number) {
  this.socket = io(environment.socketUrl, { withCredentials: true });

  this.socket.on('connect', () => {
    console.log('Socket connected!', this.socket.id);
    this.socket.emit('register', userId);
  });

  this.socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err);
  });
}

  on(event:string, callback:(data:any) => void) {
    this.socket?.on(event, callback);
  }

  disconnect(){
    this.socket?.disconnect();
  }
}
