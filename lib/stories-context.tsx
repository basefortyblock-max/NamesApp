"use client"

/**
 * stories-context.tsx
 *
 * CHANGES:
 * - valueStory() signature updated to accept optional txHash parameter
 *   to stay in sync with story-card.tsx which now passes the real onchain txHash
 *   after OnchainKit Transaction confirmation
 * - txHash parameter is currently unused in local state (price is the only
 *   UI state that needs updating) but kept in signature for consistency and
 *   future use (e.g. showing tx confirmation link in UI)
 * - All other functions (addStory, toggleLike, addComment) unchanged
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react"

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
  addStory: (
    story: Omit<
      Story,
      "id" | "likes" | "comments" | "shares" | "liked" | "price" | "createdAt"
    >
  ) => void
  toggleLike: (id: string) => void
  addComment: (
    storyId: string,
    comment: Omit<Comment, "id" | "createdAt">
  ) => void
  // txHash is optional — passed after onchain confirmation from story-card.tsx
  valueStory: (id: string, amount: number, txHash?: string) => void
}

const INITIAL_STORIES: Story[] = []

const StoriesContext = createContext<StoriesState | null>(null)

export function StoriesProvider({ children }: { children: ReactNode }) {
  const [stories, setStories] = useState<Story[]>(INITIAL_STORIES)

  const addStory = useCallback(
    (
      newStory: Omit<
        Story,
        | "id"
        | "likes"
        | "comments"
        | "shares"
        | "liked"
        | "price"
        | "createdAt"
      >
    ) => {
      setStories((prev) => [
        {
          ...newStory,
          id: Date.now().toString(),
          likes: 0,
          comments: [],
          shares: 0,
          liked: false,
          price: 0.7,
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

  const addComment = useCallback(
    (storyId: string, comment: Omit<Comment, "id" | "createdAt">) => {
      setStories((prev) =>
        prev.map((s) =>
          s.id === storyId
            ? {
                ...s,
                comments: [
                  ...s.comments,
                  {
                    ...comment,
                    id: Date.now().toString(),
                    createdAt: new Date().toISOString(),
                  },
                ],
              }
            : s
        )
      )
    },
    []
  )

  // txHash received from story-card after onchain confirmation
  // Used to sync local price state; DB update is handled separately in story-card
  const valueStory = useCallback(
    (id: string, amount: number, txHash?: string) => {
      setStories((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, price: s.price + amount } : s
        )
      )
    },
    []
  )

  return (
    <StoriesContext.Provider
      value={{ stories, addStory, toggleLike, addComment, valueStory }}
    >
      {children}
    </StoriesContext.Provider>
  )
}

export function useStories() {
  const ctx = useContext(StoriesContext)
  if (!ctx) throw new Error("useStories must be used within StoriesProvider")
  return ctx
}