import Image from "next/image";
import { BubbleChat } from "./bubbleChat";
import { ArrowUp } from "lucide-react";

// Types & Interfaces
type UserChat = {
  text: string
  image: string | null
  time: Date
}

type AssistantChat = {
  text: string
  isTrashRes: boolean         // gatau mau namain apa
  time: Date
}

interface AppProps {
  totalEmissionReduction: number
  totalPrice: number
  userChats: UserChat[]
  assistantChats: AssistantChat[]
}

// dummy data (replace with actual indexedDB or localStorage yes?)
const dummyData = {
  totalEmissionReduction: 0.5,
  totalPrice: 12000,
  userChats: [],
  assistantChats: []
} as AppProps


export default function Home() {

  const ChatsContainer = (
    <>
        <BubbleChat type="assistant" text="Ini contoh chat awalan otomatis di generasi oleh system." time="10:20" />
        <BubbleChat type="user" text="Contoh chat menggunakan gambar landscape." time="10:21" image="https://kadujayaperkasa.com/images/blog/b058a-botol%20plastik2.jpg" />
        <BubbleChat type="user" text="Contoh chat menggunakan gambar potrait." time="10:21" image="https://pict.sindonews.com/size/640/salsabila/photo/2021/06/11/1/14898/G-sampah-botol-plastik-jadi-penggerak-ekonomi-nax.jpg" />
        <BubbleChat type="user" text="Contoh chat menggunakan gambar potrait." time="10:21" image="https://pict.sindonews.com/size/640/salsabila/photo/2021/06/11/1/14898/G-sampah-botol-plastik-jadi-penggerak-ekonomi-nax.jpg" />
        <BubbleChat type="assistant" text="Contoh AI ketika response gambar tentang sampah" time="10:22" isFeedbackNeeded={true} />
        <BubbleChat type="assistant_feedback"  />
    </>
  )

  return (
    // width and height can be changed later
    <div className="w-screen h-screen flex justify-center">
      <div className="flex items-center fixed px-5 top-0 inset-0 h-15 w-full bg-background justify-between">
        <p className="text-xl font-semibold text-primary">App Name</p>
        <div className="flex gap-2">
          <div className="bg-primary px-3 py-1 rounded-full w-fit">0.05 CO₂-eq</div>
          <div className="bg-primary px-3 py-1 rounded-full w-fit">Rp.12.267</div>
        </div>
      </div>

      <div className="w-full flex flex-col gap-y-3 lg:w-300 h-full pt-17 pb-40 mx-5 sm:mx-10 md:mx-15 lg:mx-auto overflow-y-scroll">
        {ChatsContainer}
      </div>

      <div className="px-3 fixed w-screen h-14 bottom-23">
          <div className="flex gap-2 justify-center items-center w-full h-full">
              <input className="bg-secondary/90 border-2 border-tertiary backdrop-blur-xl  h-full w-full rounded-full p-5 font-semibold" placeholder="Tanya Jarvis" type="text" />
              <div className="bg-secondary/90 backdrop-blur-xl border-2 border-tertiary w-14 h-14 flex items-center justify-center rounded-full shrink-0">
                  <ArrowUp size={30} />
              </div>
          </div>
      </div>
    </div>
  );
}

