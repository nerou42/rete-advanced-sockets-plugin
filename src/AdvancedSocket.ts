import { ClassicPreset } from 'rete'

import {
  ListenerMap,
  SocketConnectionInfo,
  TypedInputEvents,
  TypeInterface
} from './types'

/**
 * Advanced socket class
 * Replaces the default type system with a callback based one and exposes information and listeners about the state of the socket
 * Only works as intended when used in an editor that has the AdvancedSocketsPlugin enabled!
 */
export class AdvancedSocket<
  T extends TypeInterface
> extends ClassicPreset.Socket {
  private readonly listeners: ListenerMap<TypedInputEvents<T>> =
    {} as ListenerMap<TypedInputEvents<T>>

  /**
   * The type that this socket is compatible with. Sub types are also compatible
   */
  private internalType: T
  private internalConnectionInfo: SocketConnectionInfo<T> | null = null

  constructor(type: T) {
    super('')
    this.internalType = type
  }

  // Add a listener for a specific event
  addListener<K extends keyof TypedInputEvents<T>>(
    event: K,
    listener: TypedInputEvents<T>[K]
  ): void {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    if (!this.listeners[event].includes(listener)) {
      this.listeners[event].push(listener)
    }
  }

  // Remove a listener for a specific event
  removeListener<K extends keyof TypedInputEvents<T>>(
    event: K,
    listener: TypedInputEvents<T>[K]
  ): void {
    if (!this.listeners[event]) return
    this.listeners[event] = this.listeners[event].filter(
      (l) => l !== listener
    ) as ListenerMap<TypedInputEvents<T>>[K]
  }

  // Emit an event
  private emit<K extends keyof TypedInputEvents<T>>(
    event: K,
    eventData: Parameters<TypedInputEvents<T>[K]>[0]
  ): void {
    if (!this.listeners[event]) return
    this.listeners[event].forEach((listener) => listener(eventData as any))
  }

  private emitOnConnectionChanged(): void {
    this.emit('onConnectionChanged', {
      oldConnection: this.connectionInfo,
      newConnection: this.connectionInfo
    })
  }

  assignableBy(socket: AdvancedSocket<T>): boolean {
    return this.internalType.assignableBy(socket.type)
  }

  set type(type: T) {
    const oldType = this.type

    this.internalType = type
    this.emit('onTypeChanged', { oldType, newType: type })
    if (this.internalConnectionInfo === null) {
      return
    }
    if (this.internalConnectionInfo?.side === 'input') {
      if (!this.type.assignableBy(this.internalConnectionInfo.otherSocket.type)) {
        this.internalConnectionInfo.removeConnection()
        return
      }
    } else {
      if (!this.internalConnectionInfo.otherSocket.type.assignableBy(this.type)) {
        this.internalConnectionInfo.removeConnection()
        return
      }
    }
    this.internalConnectionInfo.otherSocket.emitOnConnectionChanged()
  }

  get type(): T {
    return this.internalType
  }

  get connectionInfo(): SocketConnectionInfo<T> | null {
    return this.internalConnectionInfo
  }

  set connectionInfo(connectionInfo: SocketConnectionInfo<T> | null) {
    const oldConnection = this.internalConnectionInfo

    this.internalConnectionInfo = connectionInfo
    this.emit('onConnectionChanged', {
      oldConnection,
      newConnection: connectionInfo
    })
  }
}
