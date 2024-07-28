import { ClassicPreset } from 'rete';
import {
  ListenerMap,
  SocketConnectionInfo,
  TypeInterface,
  TypedInputEvents,
} from './types';

/**
 * Advanced socket class
 * Replaces the default type system with a callback based one and exposes information and listeners about the state of the socket
 * Only works as intended when used in an editor that has the AdvancedSocketsPlugin enabled!
 */
export class AdvancedSocket<
  T extends TypeInterface
> extends ClassicPreset.Socket {
  private readonly listeners: ListenerMap<TypedInputEvents<T>> =
    {} as ListenerMap<TypedInputEvents<T>>;

  /**
   * The type that this socket is compatible with. Sub types are also compatible
   */
  private _type: T;
  private _connectionInfo: SocketConnectionInfo<T> | undefined = undefined;

  constructor(type: T) {
    super('');
    this._type = type;
  }

  // Add a listener for a specific event
  addListener<K extends keyof TypedInputEvents<T>>(
    event: K,
    listener: TypedInputEvents<T>[K]
  ): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    if (!this.listeners[event].includes(listener)) {
      this.listeners[event].push(listener);
    }
  }

  // Remove a listener for a specific event
  removeListener<K extends keyof TypedInputEvents<T>>(
    event: K,
    listener: TypedInputEvents<T>[K]
  ): void {
    if (!this.listeners[event]) return;
    const a = this.listeners[event];
    this.listeners[event] = this.listeners[event].filter(
      (l) => l !== listener
    ) as ListenerMap<TypedInputEvents<T>>[K];
  }

  // Emit an event
  private emit<K extends keyof TypedInputEvents<T>>(
    event: K,
    eventData: Parameters<TypedInputEvents<T>[K]>[0]
  ): void {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach((listener) => listener(eventData as any));
  }

  private emitOnConnectionChanged(): void {
    this.emit('onConnectionChanged', {
      oldConnection: this.connectionInfo,
      newConnection: this.connectionInfo,
    });
  }

  assignableBy(socket: AdvancedSocket<T>): boolean {
    return this._type.assignableBy(socket.type);
  }

  set type(type: T) {
    const oldType = this.type;
    this._type = type;
    this.emit('onTypeChanged', { oldType, newType: type });
    if (this._connectionInfo === undefined) {
      return;
    }
    if (this._connectionInfo?.side === 'input') {
      if (!this.type.assignableBy(this._connectionInfo.otherSocket.type)) {
        this._connectionInfo.removeConnection();
        return;
      }
    } else {
      if (!this._connectionInfo.otherSocket.type.assignableBy(this.type)) {
        this._connectionInfo.removeConnection();
        return;
      }
    }
    this._connectionInfo.otherSocket.emitOnConnectionChanged();
  }

  get type(): T {
    return this._type;
  }

  get connectionInfo(): SocketConnectionInfo<T> | undefined {
    return this._connectionInfo;
  }

  set connectionInfo(connectionInfo: SocketConnectionInfo<T> | undefined) {
    const oldConnection = this._connectionInfo;
    this._connectionInfo = connectionInfo;
    this.emit('onConnectionChanged', {
      oldConnection,
      newConnection: connectionInfo,
    });
  }
}
