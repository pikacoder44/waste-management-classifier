const ALLOWED_IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "bmp",
  "avif",
]);
export default function isSupportedImageFile(file: File): boolean {
  const extension = file.name.split(".").pop()?.toLowerCase();
  return (
    file.type.startsWith("image/") ||
    (extension !== undefined && ALLOWED_IMAGE_EXTENSIONS.has(extension))
  );
};