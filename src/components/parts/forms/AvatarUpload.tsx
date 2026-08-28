import React, { useState, useEffect } from "react"
import { Loader2, ImageIcon } from "lucide-react"
import { type Crop } from "react-image-crop"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ImageCropper, getCroppedImg } from "@/components/ui/image-cropper"
import { supabase } from "@/DB"
import { RippleButton } from "@/components/animate-ui/buttons/ripple"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export interface AvatarUploadProps {
  user: any
  setAvatar: (url: string) => void
}

/* Avatar Upload Form */
export default function AvatarUpload({ user, setAvatar }: AvatarUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 100,
    height: 100,
    x: 0,
    y: 0
  })

  // Reset state when dialog closes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Check type
    if (selectedFile.type !== "image/png") {
      toast.error("Only PNG files are allowed.");
      return;
    }

    // Check size (2MB)
    if (selectedFile.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    setFile(selectedFile)
    const objectUrl = URL.createObjectURL(selectedFile)
    setPreviewUrl(objectUrl)
  }

  const handleUpload = async () => {
    if (!file || !user || !previewUrl) return
    setUploading(true)

    try {
      // Get cropped PNG blob
      const croppedBlob = await getCroppedImg(previewUrl, crop, "image/png")
      if (!croppedBlob) throw new Error("Failed to crop image")

      const filePath = `${user.id}/avatar.png`

      const { error } = await supabase.storage
        .from("profiles")
        .upload(filePath, croppedBlob, { upsert: true })

      if (error) throw error

      // Get public URL
      const { data: avatarData } = supabase.storage
        .from("profiles")
        .getPublicUrl(filePath)

      if (avatarData?.publicUrl) {
        setAvatar(avatarData.publicUrl)
      }

      toast.success("Avatar updated!")
      window.location.reload()
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Failed to upload avatar")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Preview Area */}
      <div
        className={cn(
          "relative min-h-[200px] rounded-lg border-2 border-dashed flex items-center justify-center transition-colors",
          previewUrl ? "border-primary/20 bg-primary/5" : "border-gray-200 hover:border-gray-300"
        )}
        onDragOver={(e) => e.preventDefault()} // allow drop
        onDrop={(e) => {
          e.preventDefault();
          const droppedFile = e.dataTransfer.files[0];
          if (!droppedFile) return;

          // Check type
          if (droppedFile.type !== "image/png") {
            toast.error("Only PNG files are allowed.");
            return;
          }

          // Check size
          if (droppedFile.size > 2 * 1024 * 1024) {
            toast.error("File size must be less than 2MB");
            return;
          }

          setFile(droppedFile);
          const objectUrl = URL.createObjectURL(droppedFile);
          setPreviewUrl(objectUrl);
        }}
      >
        {previewUrl ? (
          <div className="w-full h-full p-4">
            <ImageCropper
              imageSrc={previewUrl}
              crop={crop}
              onChange={(newCrop) => setCrop(newCrop)}
              aspect={1}
              className="max-w-full mx-auto"
            />
          </div>
        ) : (
          <div className="text-center p-6">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <Label htmlFor="avatar-upload" className="cursor-pointer">
                <span className="text-primary font-semibold">Click to upload</span>
                <span className="text-gray-600"> or drag and drop</span>
              </Label>
            </div>
            <p className="text-xs text-gray-500 mt-2">PNG up to 2MB</p>
          </div>
        )}

        <Input
          id="avatar-upload"
          type="file"
          accept="image/png"
          className="sr-only"
          onChange={handleFileSelect}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        {previewUrl && (
          <Button
            variant="outline"
            onClick={() => {
              setPreviewUrl(null)
              setFile(null)
            }}
            disabled={uploading}
          >
            Reset
          </Button>
        )}
        <RippleButton
          onClick={handleUpload}
          disabled={!previewUrl || uploading}
          className="min-w-[100px]"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upload"}
        </RippleButton>
      </div>
    </div>
  )
}
