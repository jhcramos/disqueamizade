export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store')
  return res.status(410).json({
    error: 'Disabled',
    message: 'Client-triggered email auto-confirmation is disabled for security.',
  })
}
