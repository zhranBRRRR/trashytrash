"use client"

import { BubbleChat } from "./bubbleChat";
import { ArrowUp, ImagePlus, Loader, X } from "lucide-react";
import { JSX, useEffect, useRef, useState } from "react";
import { fileToImageInput, generateContentWithTools, wasteAnalysisTool } from "@/services/gemini";
import { sleep } from "./lib/sleep";
import { chatSystemPrompts } from "./lib/systemPrompts";

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
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [ inputVal, setInputVal ] = useState("")
  const [ appState, setAppState ] = useState<AppProps>(dummyData)
  const [ isUserTurn, setIsUserTurn ] = useState(true)
  const [ isWaitingAIRes, setIsWaitingAIRes ] = useState(false)
  const [ selectedImage, setSelectedImage ] = useState<File | null>(null)
  const [ previewUrl, setPreviewUrl ] = useState<string | null>(null)


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

  const addUserChat = (text: string, image?: string) => {
    setAppState((prev) => {
      return {
        ...prev,
        chats: [
          ...prev.chats,
          {
            type: "user",
            text: text,
            image: image,
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

  const addAssistantChat = (text: string, isAnalysis: boolean) => {
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
            isTrashRes: isAnalysis
          }
        ]
      }
    })
  }

  const onFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setSelectedImage(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const clearSelectedImage = () => {
    setSelectedImage(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const DELETETHISONLYTEMPORARY = (any: any) => {       // temporary console print out 
    console.log(any)                                    // for analysis result 
  }                                                     // that need to be stored in db

  const onSendHandler = async () => {
    if ((inputVal === "" && !selectedImage) || !isUserTurn) return

    const textToSend = inputVal
    const imageToSend = selectedImage

    setInputVal("")
    clearSelectedImage()
    setIsUserTurn(false)
    addUserChat(textToSend, imageToSend ? previewUrl ?? undefined : undefined)
    sleep(0.3)                  // for life like feeling
    setIsWaitingAIRes(true)

    let res

    if (imageToSend) {
      const imageInput = await fileToImageInput(imageToSend)
      res = await generateContentWithTools(
        textToSend || "Analyse this waste image",
        [wasteAnalysisTool],
        "gemini-3.1-flash-lite",
        chatSystemPrompts,
        imageInput
      )
    } else {
      res = await generateContentWithTools(textToSend, [wasteAnalysisTool], "gemini-3.1-flash-lite")
    }

    if (res.success) {
      setIsWaitingAIRes(false)

      // if the AI didnt analyze image
      if (res.functionCalls.length == 0 && res.text) {
        addAssistantChat(res.text, false)
      }

      // if the AI analyze image
      if (res.functionCalls.length != 0 && res.text) {
        addAssistantChat(res.text, true)
        DELETETHISONLYTEMPORARY({
          "Type": res.functionCalls[0].args.wasteType,
          "Emmision Reduction": res.functionCalls[0].args.emissionReduction,
          "Price": res.functionCalls[0].args.price
        })
      }
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

      <div className="px-3 fixed w-screen bottom-23">
        <div className="flex flex-col gap-2 items-center max-w-full mx-auto lg:max-w-300">
          {previewUrl &&
            <div className="relative self-start">
              <img
                className="max-h-24 rounded-lg border-2 border-tertiary"
                src={previewUrl}
                alt="preview"
              />
              <div
                onClick={clearSelectedImage}
                className="absolute -top-2 -right-2 bg-red-500 rounded-full p-0.5 cursor-pointer"
              >
                <X size={16} className="text-white" />
              </div>
            </div>
          }

          <div className="flex gap-2 justify-center items-center w-full h-14">
            <input
              ref={fileInputRef}
              className="hidden"
              type="file"
              accept="image/*"
              onChange={onFileSelected}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="bg-secondary/90 backdrop-blur-xl border-2 border-tertiary w-14 h-full flex items-center justify-center rounded-full shrink-0 cursor-pointer"
            >
              <ImagePlus size={28} />
            </div>

            <input
              className="bg-secondary/90 border-2 border-tertiary backdrop-blur-xl h-full w-full rounded-full p-5 font-semibold"
              placeholder="Tanya Jarvis"
              type="text"
              value={inputVal}
              onChange={(event) => setInputVal(event.target.value)}
              ref={inputRef}
            />
            <div onClick={onSendHandler} className="bg-secondary/90 backdrop-blur-xl border-2 border-tertiary w-14 h-14 flex items-center justify-center rounded-full shrink-0 cursor-pointer">
              <ArrowUp size={30} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
