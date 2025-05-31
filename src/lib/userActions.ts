import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function logUserAction(userId: string, actionType: string, description: string) {
  try {
    await addDoc(collection(db, "userActions"), {
      userId,
      actionType,
      description,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error registrando acción de usuario:", error);
  }
}
