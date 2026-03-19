import { type Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
interface ImageCropperProps {
    imageSrc: string;
    crop: Crop;
    onChange: (crop: Crop) => void;
    aspect?: number;
    className?: string;
}
export declare function ImageCropper({ imageSrc, crop, onChange, aspect, className }: ImageCropperProps): import("react/jsx-runtime").JSX.Element;
export declare function getCroppedImg(imageSrc: string, pixelCrop: Crop, p0: string): Promise<Blob | null>;
export {};
