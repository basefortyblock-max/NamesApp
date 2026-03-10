import { notFound } from "next/navigation"

interface Story {
  id: string
  username: string
  platform: string
  story: string
  price: number
  likes: number
  shares: number
  verified: boolean
  createdAt: string
  userId: string
}

async function fetchStory(id: string): Promise<Story> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  
  try {
    const response = await fetch(`${baseUrl}/api/stories/${id}`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      throw new Error('Story not found')
    }
    
    const data = await response.json()
    return data.story
  } catch (error) {
    console.error('Error fetching story:', error)
    throw error
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const story = await fetchStory(id)
    
    return {
      title: `${story.username}'s Philosophy | Names`,
      description: story.story.substring(0, 200),
      openGraph: {
        title: `${story.username}'s Philosophy`,
        description: story.story.substring(0, 200),
        images: [`/story/${id}/og-image`],
      },
      // Farcaster Frame metadata
      other: {
        'fc:frame': 'vNext',
        'fc:frame:image': `https://names-app.vercel.app/story/${id}/frame`,
        'fc:frame:button:1': 'Read Full Story',
        'fc:frame:button:1:action': 'link',
        'fc:frame:button:1:target': `https://names-app.vercel.app/story/${id}`,
        'fc:frame:button:2': 'Send Value',
        'fc:frame:button:2:action': 'post',
        'fc:frame:post_url': `https://names-app.vercel.app/api/farcaster/value`,
      },
    }
  } catch (error) {
    return {
      title: 'Story Not Found | Names',
      description: 'This story could not be found.',
    }
  }
}

export default async function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let story: Story
  
  try {
    story = await fetchStory(id)
  } catch (error) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <article className="rounded-xl border border-border bg-card p-6">
        {/* Story Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <span className="text-lg font-bold text-primary">
              {story.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-base font-bold text-foreground">
                @{story.username}
              </p>
              {story.verified && (
                <div className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5">
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">
                    Verified
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{story.platform}</span>
              <span>•</span>
              <span>{new Date(story.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-primary">
              {story.price.toFixed(2)} USDC
            </p>
            <p className="text-xs text-muted-foreground">
              Starting price
            </p>
          </div>
        </div>

        {/* Story Content */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            The Philosophy Behind @{story.username}
          </h1>
          <p className="text-base leading-relaxed text-foreground whitespace-pre-wrap">
            {story.story}
          </p>
        </div>

        {/* Story Stats */}
        <div className="flex items-center gap-6 pt-4 border-t border-border text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span>❤️</span>
            <span>{story.likes || 0} likes</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>🔗</span>
            <span>{story.shares || 0} shares</span>
          </div>
        </div>
      </article>
    </div>
  )
}
