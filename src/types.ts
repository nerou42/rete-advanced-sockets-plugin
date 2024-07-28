import { ClassicPreset, GetSchemes } from 'rete';
import { AdvancedSocket } from './AdvancedSocket';

export type EventListener<Event = undefined, Return = void> = (
  e: Event
) => Return;

export type ListenerMap<
  Events extends Record<string, EventListener<any, any>>
> = {
  [K in keyof Events]: Events[K][];
};

type Side = 'input' | 'output';

export interface TypeInterface {
  assignableBy(socketType: TypeInterface): boolean;
}

export type SocketConnectionInfo<T extends TypeInterface> = {
  connection: Connection;
  side: Side;
  otherSocket: AdvancedSocket<T>;
  removeConnection: () => void;
};

export type OnTypeChangedEvent<T extends TypeInterface> = {
  oldType: T;
  newType: T;
};
export type OnConnectionChangedEvent<T extends TypeInterface> = {
  oldConnection: SocketConnectionInfo<T> | undefined;
  newConnection: SocketConnectionInfo<T> | undefined;
};

export type TypedInputEvents<T extends TypeInterface> = {
  onTypeChanged: EventListener<OnTypeChangedEvent<T>>;
  onConnectionChanged: EventListener<OnConnectionChangedEvent<T>>;
};

export type Node<
  T extends TypeInterface,
  Inputs extends {
    [key in string]?: AdvancedSocket<T>;
  } = {
    [key in string]?: AdvancedSocket<T>;
  },
  Outputs extends {
    [key in string]?: AdvancedSocket<T>;
  } = {
    [key in string]?: AdvancedSocket<T>;
  },
  Controls extends {
    [key in string]?: ClassicPreset.Control;
  } = {
    [key in string]?: ClassicPreset.Control;
  }
> = ClassicPreset.Node<Inputs, Outputs, Controls>;

export type Connection = ClassicPreset.Connection<
  ClassicPreset.Node,
  ClassicPreset.Node
>;

export type TypedScheme<T extends TypeInterface> = GetSchemes<
  Node<T>,
  Connection
>;
