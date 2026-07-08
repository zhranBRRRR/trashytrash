export type Chat = {
  type: "assistant" | "user"
  text: string
  image?: string
  feedback?: boolean
  isTrashRes?: boolean         // gatau mau namain apa
  time: string
}

export type Chats = Chat[]