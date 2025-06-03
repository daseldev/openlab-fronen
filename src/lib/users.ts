// Ejemplo usando Firestore
import { getFirestore, collection, getDocs } from "firebase/firestore";
import app from "@/lib/firebase"; // Asegúrate de tener este archivo configurado

const db = getFirestore(app);

export async function getAllUsers() {
  const usersCol = collection(db, "users");
  const usersSnapshot = await getDocs(usersCol);
  return usersSnapshot.docs.map(doc => ({
    uid: doc.id,
    ...doc.data(),
  }));
}