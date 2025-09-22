import * as React from "react"
import ReactCrop, { type Crop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"

interface ImageCropperProps {
  imageSrc: string
  crop: Crop
  onChange: (crop: Crop) => void
  aspect?: number
  className?: string
}

export function ImageCropper({
  imageSrc,
  crop,
  onChange,
  aspect,
  className
}: ImageCropperProps) {
  return (
    <ReactCrop
      crop={crop}
      onChange={onChange}
      aspect={aspect}
      className={className}
    >
      <img src={imageSrc} alt="Crop preview" className="max-h-[400px] w-auto" />
    </ReactCrop>
  )
}

// Helper function to get the cropped image as a blob
export async function getCroppedImg(
imageSrc: string, pixelCrop: Crop, p0: string): Promise<Blob | null> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    return null
  }

  // Set canvas size to match the crop dimensions
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  // Draw the cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob)
    }, "image/jpeg")
  })
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener("load", () => resolve(image))
    image.addEventListener("error", (error) => reject(error))
    image.src = url
  })
}