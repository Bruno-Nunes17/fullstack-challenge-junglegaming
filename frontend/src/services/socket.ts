import { io, Socket } from "socket.io-client";

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (!this.socket) {
      this.socket = io("http://localhost:8000", {
        path: "/games/socket.io"
      });
      
      this.socket.on("connect", () => {
        
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on<T>(event: string, callback: (data: T) => void) {
    this.socket?.on(event, (data: unknown) => {
      callback(data as T);
    });
  }

  off(event: string) {
    this.socket?.off(event);
  }
}

export const socketService = new SocketService();
