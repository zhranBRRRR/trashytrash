"use client"

import Image from "next/image";
import { BubbleChat } from "./bubbleChat";
import { ArrowUp, Loader } from "lucide-react";
import { JSX, useEffect, useRef, useState } from "react";
import { extractReplyText, generateContent } from "@/services/gemini";
import { sleep } from "./lib/sleep";

// Types & Interfaces
type Chat = {
  type: "assistant" | "user"
  text: string
  image?: string
  isTrashRes?: boolean         // gatau mau namain apa
  time: string
}

interface AppProps {
  totalEmissionReduction: number
  totalPrice: number
  chats: Chat[]
}

// dummy data (replace with actual indexedDB or localStorage yes?)
const dummyData = {
  totalEmissionReduction: 0.5,
  totalPrice: 12000,
  chats: []
} as AppProps


export default function Home(): JSX.Element {

  const inputRef = useRef<HTMLInputElement | null>(null)

  const [ inputVal, setInputVal ] = useState("")
  const [ appState, setAppState ] = useState<AppProps>(dummyData)
  const [ isUserTurn, setIsUserTurn ] = useState(true)
  const [ isWaitingAIRes, setIsWaitingAIRes ] = useState(false)


  // populate the chat for the first time
  useEffect(() => {
    setAppState((prev) => {
      if (prev.chats.length > 0) {
        return prev
      }

      return {
        ...prev,
        chats: [
          ...prev.chats,
          {
            type: "assistant",
            text: "Halo, saya bisa kalkulasi reduksi emisi dan nilai tukar sampah-sampah anda. Jangan lupa upload gambar sampah anda ke saya dahulu ya.",
            time: new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }),
          },
        ],
      }
    })
  }, [setAppState])

  const addUserChat = (text: string) => {
    setAppState((prev) => {
      return {
        ...prev,
        chats: [
          ...prev.chats,
          {
            type: "user",
            text: text,
            time: new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }),
          }
        ]
      }
    })
  }

  const addAssistantChat = (text: string) => {
    setAppState((prev) => {
      return {
        ...prev,
        chats: [
          ...prev.chats,
          {
            type: "assistant",
            text: text,
            time: new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }),
          }
        ]
      }
    })
  }

  const onSendHandler = async () => {
    if (inputVal === "" || !isUserTurn) return
    setInputVal("")

    setIsUserTurn(false)
    addUserChat(inputVal)
    
    sleep(0.3)                  // for life like feeling

    setIsWaitingAIRes(true)

    const res = await generateContent(inputVal, "gemini-3.1-flash-lite")
    if (res.success) {
      const reply = extractReplyText(res)

      setIsWaitingAIRes(false)
      if (reply) addAssistantChat(reply)
    } else {
      console.error(res.error)    // add error to UI
    }

    setIsUserTurn(true)
  }

  const ChatsContainer = (
    <>
      {appState.chats.map((chat, index) => (
        <BubbleChat
          key={index}
          index={index}
          type={chat.type === "user" ? "user" : "assistant"}
          text={chat.text}
          time={chat.time}
          image={chat.image}
          isFeedbackNeeded={chat.isTrashRes}
        />
      ))}

      {/* <BubbleChat type="assistant" text="Ini contoh chat awalan otomatis di generasi oleh system." time="10:20" />
      <BubbleChat type="user" text="Contoh chat menggunakan gambar landscape." time="10:21" image="https://kadujayaperkasa.com/images/blog/b058a-botol%20plastik2.jpg" />
      <BubbleChat type="user" text="Contoh chat menggunakan gambar potrait." time="10:21" image="https://pict.sindonews.com/size/640/salsabila/photo/2021/06/11/1/14898/G-sampah-botol-plastik-jadi-penggerak-ekonomi-nax.jpg" />
      <BubbleChat type="user" text="Contoh chat menggunakan gambar potrait." time="10:21" image="https://pict.sindonews.com/size/640/salsabila/photo/2021/06/11/1/14898/G-sampah-botol-plastik-jadi-penggerak-ekonomi-nax.jpg" />
      <BubbleChat type="assistant" text="Contoh AI ketika response gambar tentang sampah" time="10:22" isFeedbackNeeded={true} />
      <BubbleChat type="assistant_feedback"  /> */}
    </>
  )

  return (
    // width and height can be changed later
    <div className="w-screen h-screen flex justify-center">
      <div className="flex items-center fixed px-5 top-0 inset-0 h-15 w-full bg-background justify-between">
        <p className="text-xl font-semibold text-primary">App Name</p>
        <div className="flex gap-2">
          <div className="bg-primary px-3 py-1 rounded-full w-fit">{appState.totalEmissionReduction} CO₂-eq</div>
          <div className="bg-primary px-3 py-1 rounded-full w-fit">Rp.{appState.totalPrice.toLocaleString("ID")}</div>
        </div>
      </div>

      <div className="w-full flex flex-col gap-y-3 lg:w-300 h-full pt-17 pb-40 mx-5 sm:mx-10 md:mx-15 lg:mx-auto overflow-y-scroll">
        {ChatsContainer}

        {isWaitingAIRes &&        
          <div className="w-full h-fit flex gap-2">
            <Loader className="animate-[spin_3s_linear_infinite] text-primary" />
            <p className="text-primary font-semibold">Thinking...</p>
          </div>
        }
      </div>

      <div className="px-3 fixed w-screen h-14 bottom-23">
          <div className="flex gap-2 justify-center items-center w-full h-full">
              <input
                className="bg-secondary/90 border-2 border-tertiary backdrop-blur-xl  h-full w-full rounded-full p-5 font-semibold"
                placeholder="Tanya Jarvis"
                type="text"
                value={inputVal}
                onChange={(event) => setInputVal(event.target.value)}
                ref={inputRef}
              />
              <div onClick={onSendHandler} className="bg-secondary/90 backdrop-blur-xl border-2 border-tertiary w-14 h-14 flex items-center justify-center rounded-full shrink-0">
                  <ArrowUp size={30} />
              </div>
          </div>
      </div>
    </div>
  );
}

