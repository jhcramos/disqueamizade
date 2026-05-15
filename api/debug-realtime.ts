export default async function handler(_req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store')
  return res.status(410).json({
    error: 'Disabled',
    message: 'Debug WebRTC endpoint is disabled in production.',
  })
}
