import React from 'react'
import { createRoot } from 'react-dom/client'
import '../src/styles/index.css'
import { CameraPreview, CameraSetupProvider } from '../src/rooms/CameraSetup'

if (!import.meta.env.DEV) throw new Error('Development fixture only')

// Synthetic camera for checking both CTA states without requesting a real device.
const canvas = document.createElement('canvas')
canvas.width = 640
canvas.height = 480
const context = canvas.getContext('2d')!
context.fillStyle = '#171827'
context.fillRect(0, 0, canvas.width, canvas.height)
const syntheticStream = canvas.captureStream(30)
navigator.mediaDevices.getUserMedia = async () => syntheticStream

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CameraSetupProvider>
      <CameraPreview onContinue={() => {}} onSkip={() => {}} onCancel={() => {}} />
    </CameraSetupProvider>
  </React.StrictMode>,
)
