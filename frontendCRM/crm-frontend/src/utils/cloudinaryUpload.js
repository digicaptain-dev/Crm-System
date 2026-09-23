/**
 * Cloudinary Direct Upload Utility
 * Handles direct unsigned browser uploads to Cloudinary with auto-compression.
 */

const CLOUDINARY_CLOUD_NAME = "zr5fm2sc";
const CLOUDINARY_UPLOAD_PRESET = "digi_pipeline";

/**
 * Compresses an image file in browser using HTML5 Canvas
 * @param {File|Blob} file 
 * @param {number} maxWidth 
 * @param {number} quality 
 * @returns {Promise<Blob>}
 */
export async function compressImage(file, maxWidth = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              resolve(file);
            }
          },
          "image/webp",
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

/**
 * Uploads an image file or blob directly to Cloudinary
 * @param {File|Blob} file 
 * @returns {Promise<string>} Secure URL of uploaded image
 */
export async function uploadToCloudinary(file) {
  if (!file) throw new Error("No image file provided for upload.");

  // Compress image before upload for speed and storage optimization
  const compressedBlob = await compressImage(file);

  const formData = new FormData();
  formData.append("file", compressedBlob, "screenshot.webp");
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data?.error?.message || "Failed to upload image to Cloudinary.";
    console.error("Cloudinary upload failed:", errorMsg, data);
    throw new Error(errorMsg);
  }

  return data.secure_url;
}
