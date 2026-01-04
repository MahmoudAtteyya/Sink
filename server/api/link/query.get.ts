export default eventHandler(async (event) => {
  const slug = getQuery(event).slug
  if (slug) {
    const KV = getKV(event)
    const { metadata, value: link } = await KV.getWithMetadata(`link:${slug}`, { type: 'json' })
    if (link) {
      return {
        ...metadata,
        ...link,
      }
    }
  }
  throw createError({
    status: 404,
    statusText: 'Not Found',
  })
})
