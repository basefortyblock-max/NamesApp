export async function generateMetadata({ params }: { params: { id: string } }) {
  const story = await fetchStory(params.id)
  
  return {
    title: `${story.username}'s Philosophy | Names`,
    description: story.story.substring(0, 200),
    openGraph: {
      title: `${story.username}'s Philosophy`,
      description: story.story.substring(0, 200),
      images: [`/story/${params.id}/og-image`],
    },
    // Farcaster Frame metadata
    other: {
      'fc:frame': 'vNext',
      'fc:frame:image': `https://names-app.vercel.app/story/${params.id}/frame`,
      'fc:frame:button:1': 'Read Full Story',
      'fc:frame:button:1:action': 'link',
      'fc:frame:button:1:target': `https://names-app.vercel.app/story/${params.id}`,
      'fc:frame:button:2': 'Send Value',
      'fc:frame:button:2:action': 'post',
      'fc:frame:post_url': `https://names-app.vercel.app/api/farcaster/value`,
    },
  }
}