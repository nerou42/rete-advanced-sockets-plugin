import { NodeEditor, Root, Scope } from 'rete'
import { AdvancedSocket } from './AdvancedSocket'
import { Connection, TypedScheme, TypeInterface } from './types'

export class AdvancedSocketsPlugin<
  T extends TypeInterface,
  Scheme extends TypedScheme<T>
> extends Scope<never, [Root<Scheme>]> {
  constructor() {
    super('FormulaPlugin')
  }

  public silent: boolean = false;

  override setParent(scope: Scope<Root<Scheme>, []>): void {
    super.setParent(scope)
    const editor = this.parentScope<NodeEditor<Scheme>>(NodeEditor<Scheme>)

    this.addPipe((context: Root<Scheme>) => {
      if(this.silent) {
        return context;
      }
      if (context.type === 'connectioncreate') {
        const [outputSocket, inputSocket] = this.socketsByConnection(
          context.data,
          editor
        )

        if (!outputSocket || !inputSocket?.assignableBy(outputSocket)) {
          // console.log(
          //   'Socket of type',
          //   inputSocket?.type,
          //   'is not assignable by socket of type ',
          //   outputSocket?.type
          // )
          return
        }
      } else if (context.type === 'connectioncreated') {
        const [outputSocket, inputSocket] = this.socketsByConnection(
          context.data,
          editor
        )

        if (inputSocket && outputSocket) {
          const removeConnection = () => {
            editor.removeConnection(context.data.id)
          }

          inputSocket.connectionInfo = {
            connection: context.data,
            side: 'input',
            otherSocket: outputSocket,
            removeConnection
          }
          outputSocket.connectionInfo = {
            connection: context.data,
            side: 'output',
            otherSocket: inputSocket,
            removeConnection
          }
        }
      }
      if (context.type === 'connectionremoved') {
        const [outputSocket, inputSocket] = this.socketsByConnection(
          context.data,
          editor
        )

        if (inputSocket) inputSocket.connectionInfo = null
        if (outputSocket) outputSocket.connectionInfo = null
      }
      return context
    })
  }

  private socketsByConnection(
    connection: Connection,
    editor: NodeEditor<Scheme>
  ): [AdvancedSocket<T> | undefined, AdvancedSocket<T> | undefined] {
    const sourceNode = editor.getNode(connection.source)
    const targetNode = editor.getNode(connection.target)
    const output = sourceNode.outputs[connection.sourceOutput]
    const input = targetNode.inputs[connection.targetInput]

    return [output?.socket, input?.socket]
  }
}
