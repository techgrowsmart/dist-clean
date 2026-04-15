import { io, Socket } from 'socket.io-client';
import { getAuthToken } from '../utils/authStorage';
import { Platform } from 'react-native';

const PROD_SOCKET_URL = 'wss://growsmartserver.gogrowsmart.com';
const DEV_SOCKET_URL = 'http://localhost:3000';
const SOCKET_URL = process.env.NODE_ENV === 'production' || process.env.EXPO_PUBLIC_DEV_MODE === 'false'
  ? PROD_SOCKET_URL
  : (process.env.EXPO_PUBLIC_WS_URL || DEV_SOCKET_URL);

class SocketService {
  private socket: Socket | null = null;
  private static instance: SocketService;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Map<string, Set<Function>> = new Map();

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  async connect(): Promise<void> {
    if (this.socket?.connected) {
      console.log('🔌 Socket already connected');
      return;
    }

    try {
      const token = await getAuthToken();
      if (!token) {
        console.error('❌ No auth token available for socket connection');
        throw new Error('Authentication required');
      }

      console.log('🔌 Connecting to WebSocket server...');

      this.socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['polling', 'websocket'], // Polling first for better compatibility
        timeout: 20000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        withCredentials: true,
      });

      this.setupEventHandlers();
    } catch (error) {
      console.error('❌ Socket connection error:', error);
      throw error;
    }
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('❌ Max reconnection attempts reached');
        this.socket?.disconnect();
      }
    });

    // Booking request events
    this.socket.on('new_booking_request', (data) => {
      console.log('📨 New booking request received:', data);
      this.notifyListeners('new_booking_request', data);
    });

    this.socket.on('new_booking_request_broadcast', (data) => {
      console.log('📨 Booking broadcast received:', data);
      this.notifyListeners('new_booking_request_broadcast', data);
    });

    this.socket.on('booking_status_update', (data) => {
      console.log('📬 Booking status update received:', data);
      this.notifyListeners('booking_status_update', data);
    });

    this.socket.on('booking_request_sent', (data) => {
      console.log('✅ Booking request sent confirmation:', data);
      this.notifyListeners('booking_request_sent', data);
    });

    this.socket.on('booking_response_confirmed', (data) => {
      console.log('✅ Booking response confirmed:', data);
      this.notifyListeners('booking_response_confirmed', data);
    });

    this.socket.on('booking_cancelled', (data) => {
      console.log('❌ Booking cancelled:', data);
      this.notifyListeners('booking_cancelled', data);
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
      this.notifyListeners('error', error);
    });
  }

  // Subscribe to events
  on(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private notifyListeners(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  // Emit events
  emit(event: string, data: any): void {
    if (!this.socket?.connected) {
      console.warn('⚠️ Socket not connected. Message not sent:', event);
      return;
    }
    this.socket.emit(event, data);
  }

  // Send booking request (student -> teacher)
  sendBookingRequest(data: {
    teacherEmail: string;
    subject: string;
    className?: string;
    charge?: number;
    studentInfo?: any;
  }): void {
    this.emit('booking_request', data);
  }

  // Respond to booking request (teacher -> student)
  respondToBooking(data: {
    bookingId: string;
    studentEmail: string;
    status: 'accepted' | 'rejected';
    message?: string;
  }): void {
    this.emit('booking_response', data);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('🔌 Socket disconnected manually');
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocketId(): string | null {
    return this.socket?.id || null;
  }
}

export const socketService = SocketService.getInstance();
export default socketService;
