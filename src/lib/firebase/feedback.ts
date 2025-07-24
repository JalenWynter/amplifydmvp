import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./client";
import { v4 as uuidv4 } from 'uuid';

export async function uploadAudioFeedback(file: File, reviewerId: string, submissionId: string): Promise<string> {
  const fileName = `${uuidv4()}-${file.name}`;
  const audioRef = ref(storage, `audio-feedback/${reviewerId}/${submissionId}/${fileName}`);

  try {
    const snapshot = await uploadBytes(audioRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    console.log("Audio feedback uploaded successfully. Download URL:", downloadUrl);
    return downloadUrl;
  } catch (error: unknown) {
    console.error("Error uploading audio feedback:", error);
    let errorMessage = "An unknown error occurred.";
    if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === "object" && error !== null && "message" in error) {
        errorMessage = (error as { message: string }).message;
    }
    throw new Error(`Failed to upload audio feedback: ${errorMessage}`);
  }
}

export async function uploadVideoFeedback(file: File, reviewerId: string, submissionId: string): Promise<string> {
  const fileName = `${uuidv4()}-${file.name}`;
  const videoRef = ref(storage, `video-feedback/${reviewerId}/${submissionId}/${fileName}`);

  try {
    const snapshot = await uploadBytes(videoRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    console.log("Video feedback uploaded successfully. Download URL:", downloadUrl);
    return downloadUrl;
  } catch (error: unknown) {
    console.error("Error uploading video feedback:", error);
    let errorMessage = "An unknown error occurred.";
    if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === "object" && error !== null && "message" in error) {
        errorMessage = (error as { message: string }).message;
    }
    throw new Error(`Failed to upload video feedback: ${errorMessage}`);
  }
}
