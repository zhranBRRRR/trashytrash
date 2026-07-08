"use client"

import { BubbleChat } from "./bubbleChat";
import { ArrowUp, ImagePlus, Loader, X } from "lucide-react";
import { JSX, useEffect, useRef, useState } from "react";
import { extractWasteAnalysisArgs, fileToImageInput, generateContentWithTools, sendFunctionResponse, WasteAnalysisArgs, wasteAnalysisTool, type FunctionCall } from "@/app/_services/gemini";
import { sleep } from "./_lib/sleep";
import { chatSystemPrompts } from "./_lib/systemPrompts";
import { Chats } from "./_types/chats";
import { addChatDB, getAllChatsDB } from "./_db/chats.db";
import { getStats, saveStats } from "./_db/stats.localstorage";
import { fileToBase64 } from "./_lib/fileToBase64";
import { addHistoryDB } from "./_db/histories.db";

// Types & Interfaces
interface AppProps {
  totalEmissionReduction: number
  totalPrice: number
  chats: Chats
}

// initiator
const chats = await getAllChatsDB()
const stats = getStats()
console.log(chats)

const data = {
  totalEmissionReduction: stats.totalEmissionReduction,
  totalPrice: stats.totalPrice,
  chats: chats
} as AppProps

export default function Home(): JSX.Element {

  const inputRef = useRef<HTMLInputElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [ inputVal, setInputVal ] = useState("")
  const [ appState, setAppState ] = useState<AppProps>(data)
  const [ isUserTurn, setIsUserTurn ] = useState(true)
  const [ isWaitingAIRes, setIsWaitingAIRes ] = useState(false)
  const [ selectedImage, setSelectedImage ] = useState<File | null>(null)
  const [ previewUrl, setPreviewUrl ] = useState<string | null>(null)
  const [ lastImage, setLastImage ] = useState<string | null>(null)

  // populate the chat for the first time
  useEffect(() => {
    if (appState.chats.length == 0) {
      addChatDB({
        type: "assistant",
        text: "Halo, saya bisa kalkulasi reduksi emisi dan nilai tukar sampah-sampah anda. Jangan lupa upload gambar sampah anda ke saya dahulu ya.",
        time: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      }).then(() => {
        getAllChatsDB().then((chats) => {
          setAppState((prev) => {
            return {
              ...prev,
              chats: chats
            }
          })
        })
      })
    }
  }, [setAppState])

  const addUserChat = (text: string, image?: string) => {
    addChatDB({
      type: "user",
      text: text,
      image: image,
      time: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    }).then(() => getAllChatsDB().then((chats) => {
      setAppState((prev) => {
          return {
            ...prev,
            chats: chats
          }
        })
      })
    )
  }

  const addAssistantChat = (text: string, isAnalysis: boolean) => {
    addChatDB({
      type: "assistant",
      text: text,
      time: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      isTrashRes: isAnalysis
    }).then(() => getAllChatsDB().then((chats) => {
      setAppState((prev) => {
          return {
            ...prev,
            chats: chats
          }
        })
      })
    )
  }

  const analysisHandler = async (
    res: WasteAnalysisArgs | null,
    functionCalls: FunctionCall[] = [],
    imageUrl?: string | null
  ) => {
    if (res) {
      console.log(imageUrl)

      // save stats
        const currentStats = getStats()
        saveStats({
          totalEmissionReduction: currentStats.totalEmissionReduction + res.emissionReduction,
          totalPrice: currentStats.totalPrice + res.price
        })

        // save history
        addHistoryDB({
          type: res.wasteType,
          emissionReduction: res.emissionReduction.toString(),
          sellingPrice: res.price.toString(),
          imageUrl: imageUrl ?? "",
          timestamp: new Date().toISOString()
        })

        // reload UI
        setAppState((prev) => {
          const stats = getStats()

          return {
            totalEmissionReduction: stats.totalEmissionReduction,
            totalPrice: stats.totalPrice,
            chats: [
              ...prev.chats
            ]
          }
        })

        await sendFunctionResponse(
          [wasteAnalysisTool],
          appState.chats,
          functionCalls.length > 0
            ? functionCalls
            : [{
                name: "recordWasteAnalysis",
                args: res as unknown as Record<string, unknown>,
              }],
          "OK!",
          "gemini-3.1-flash-lite",
          chatSystemPrompts
        )
    }
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

  const onSendHandler = async () => {
    if ((inputVal === "" && !selectedImage) || !isUserTurn) return

    const textToSend = inputVal
    const imageToSend = selectedImage

    setInputVal("")
    clearSelectedImage()
    setIsUserTurn(false)
    
    let base64Image: string | null = null

    if (imageToSend) {
      base64Image = await fileToBase64(imageToSend)
      setLastImage(base64Image)
      addUserChat(textToSend, base64Image)
    } else {
      addUserChat(textToSend)
    }

    sleep(0.3)                  // for life like feeling
    setIsWaitingAIRes(true)

    let res

    if (imageToSend) {
      const imageInput = await fileToImageInput(imageToSend)
      res = await generateContentWithTools(
        textToSend || "Analyse this waste image",
        [wasteAnalysisTool],
        appState.chats,
        "gemini-3.1-flash-lite",
        chatSystemPrompts,
        imageInput
      )
    } else {
      res = await generateContentWithTools(
        textToSend,
        [wasteAnalysisTool],
        appState.chats,
        "gemini-3.1-flash-lite"
      )
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

        analysisHandler(extractWasteAnalysisArgs(res), res.functionCalls, base64Image)
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
