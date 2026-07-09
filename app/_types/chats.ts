export type Chat = {
  id?: number
  type: "assistant" | "user" | "assistant_error"
  text: string
  image?: string
  feedback?: boolean
  isTrashRes?: boolean         // gatau mau namain apa
  time: string
  answerTo?: number
  analysis?: {
    emissionReduction?: number,
    price?: number
  }
}

export type Chats = Chat[]