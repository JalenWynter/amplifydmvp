import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./client";
import { v4 as uuidv4 } from 'uuid';

export async function uploadImage(file: File): Promise<string> {
  const fileName = `${uuidv4()}-${file.name}`;
  const imageRef = ref(storage, `images/${fileName}`);

  try {
    const snapshot = await uploadBytes(imageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    console.log("Image uploaded successfully. Download URL:", downloadUrl);
    return downloadUrl;
  } catch (error: unknown) {
    console.error("Error uploading image:", error);
    let errorMessage = "An unknown error occurred.";
    if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === "object" && error !== null && "message" in error) {
        errorMessage = (error as { message: string }).message;
    }
    throw new Error(`Failed to upload image: ${errorMessage}`);
  }
}
