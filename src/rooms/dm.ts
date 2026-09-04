import { ChatConversation } from '@/services/supabase/roomChat'

export interface DMMessage {
  id: string; fromId: string; fromName: string; content: string; timestamp: Date
}

/** O banco restringe leitura aos dois UUIDs autenticados, inclusive no Realtime. */
export class DMConversation {
  private conversation = new ChatConversation()
  constructor(private myId: string, private myName: string, private peerId: string) {}
  join(onMessage: (message: DMMessage) => void, onError: (error: Error) => void) {
    return this.conversation.join(`dm-${[this.myId, this.peerId].sort().join('-')}`, this.myId, this.myName,
      (message) => onMessage({ id: message.id, fromId: message.userId, fromName: message.username,
        content: message.content, timestamp: message.timestamp }), () => {}, onError)
  }
  send(content: string): Promise<void> { return this.conversation.sendMessage(this.myId, this.myName, content) }
  leave() { this.conversation.leave() }
}
