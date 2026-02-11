"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

export interface Comment {
  id: string
  author: string
  basename: string
  text: string
  createdAt: string
}

export interface Story {
  id: string
  username: string
  platform: string
  basename: string
  address: string
  story: string
  price: number
  likes: number
  comments: Comment[]
  shares: number
  liked: boolean
  createdAt: string
}

interface StoriesState {
  stories: Story[]
  addStory: (story: Omit<Story, "id" | "likes" | "comments" | "shares" | "liked" | "price" | "createdAt">) => void
  toggleLike: (id: string) => void
  addComment: (storyId: string, comment: Omit<Comment, "id" | "createdAt">) => void
  valueStory: (id: string, amount: number) => void
}

const INITIAL_STORIES: Story[] = [
  {
    id: "1",
    username: "SatoshiDreamer",
    platform: "Base",
    basename: "satoshi.base.eth",
    address: "0x7a8B...3dEf",
    story: "I chose SatoshiDreamer because Satoshi Nakamoto showed us that one person's vision can reshape the world. This name reminds me every day that dreams, no matter how audacious, are worth pursuing. In the world of blockchain, we are all dreamers building a decentralized future.",
    price: 2.50,
    likes: 47,
    comments: [
      { id: "c1", author: "CryptoSage", basename: "sage.base.eth", text: "Beautiful philosophy! The dreamer spirit lives on.", createdAt: "2026-02-10T10:00:00Z" }
    ],
    shares: 12,
    liked: false,
    createdAt: "2026-02-08T14:30:00Z",
  },
  {
    id: "2",
    username: "LunaMoonrise",
    platform: "Twitter",
    basename: "luna.base.eth",
    address: "0x2b3C...8fGh",
    story: "Luna means moon in many languages. My grandmother always told me the moon watches over those who dare to wander at night. I chose LunaMoonrise because every sunrise after a long night is a reminder that light always returns. It symbolizes hope, resilience, and the quiet strength we carry within.",
    price: 5.25,
    likes: 89,
    comments: [
      { id: "c2", author: "StarGazer", basename: "star.base.eth", text: "Your grandmother sounds incredibly wise.", createdAt: "2026-02-09T08:15:00Z" },
      { id: "c3", author: "NightOwl", basename: "owl.base.eth", text: "The moon metaphor is perfect. Love this!", createdAt: "2026-02-09T12:30:00Z" },
    ],
    shares: 23,
    liked: false,
    createdAt: "2026-02-07T09:15:00Z",
  },
  {
    id: "3",
    username: "PhoenixEth",
    platform: "Base",
    basename: "phoenix.base.eth",
    address: "0x4d5E...1iJk",
    story: "The Phoenix rises from its own ashes. I chose this name after losing everything in the 2022 bear market and rebuilding from scratch. My name is my promise: no matter how many times I fall, I will rise again. Every transaction I make on Base is a testament to that resilience.",
    price: 8.00,
    likes: 134,
    comments: [
      { id: "c4", author: "DiamondHands", basename: "diamond.base.eth", text: "This resonates deeply. We are all phoenixes.", createdAt: "2026-02-10T16:45:00Z" },
    ],
    shares: 45,
    liked: false,
    createdAt: "2026-02-06T18:45:00Z",
  },
  {
    id: "4",
    username: "ZenBuilder",
    platform: "Instagram",
    basename: "zen.base.eth",
    address: "0x6f7G...4lMn",
    story: "Zen is the art of seeing into the nature of one's own being. As a developer, I build with intention and mindfulness. Every line of code, every smart contract, every dApp is a meditation. ZenBuilder reflects my belief that the best technology comes from a place of calm clarity, not chaos.",
    price: 3.75,
    likes: 62,
    comments: [],
    shares: 8,
    liked: false,
    createdAt: "2026-02-05T11:20:00Z",
  },
]

const StoriesContext = createContext<StoriesState | null>(null)

export function StoriesProvider({ children }: { children: ReactNode }) {
  const [stories, setStories] = useState<Story[]>(INITIAL_STORIES)

  const addStory = useCallback(
    (newStory: Omit<Story, "id" | "likes" | "comments" | "shares" | "liked" | "price" | "createdAt">) => {
      setStories((prev) => [
        {
          ...newStory,
          id: Date.now().toString(),
          likes: 0,
          comments: [],
          shares: 0,
          liked: false,
          price: 0.01,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ])
    },
    []
  )

  const toggleLike = useCallback((id: string) => {
    setStories((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, liked: !s.liked, likes: s.liked ? s.likes - 1 : s.likes + 1 }
          : s
      )
    )
  }, [])

  const addComment = useCallback((storyId: string, comment: Omit<Comment, "id" | "createdAt">) => {
    setStories((prev) =>
      prev.map((s) =>
        s.id === storyId
          ? {
              ...s,
              comments: [
                ...s.comments,
                { ...comment, id: Date.now().toString(), createdAt: new Date().toISOString() },
              ],
            }
          : s
      )
    )
  }, [])

  const valueStory = useCallback((id: string, amount: number) => {
    setStories((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, price: s.price + amount } : s
      )
    )
  }, [])

  return (
    <StoriesContext.Provider value={{ stories, addStory, toggleLike, addComment, valueStory }}>
      {children}
    </StoriesContext.Provider>
  )
}

export function useStories() {
  const ctx = useContext(StoriesContext)
  if (!ctx) throw new Error("useStories must be used within StoriesProvider")
  return ctx
}
