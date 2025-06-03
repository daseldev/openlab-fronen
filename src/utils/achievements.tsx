import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function addAchievement(userId: string, achievement: string) {
  await updateDoc(doc(db, "users", userId), {
    achievements: arrayUnion(achievement),
  });
}