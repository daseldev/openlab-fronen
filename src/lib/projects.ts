import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { Project, CreateProjectData, UpdateProjectData } from "@/types/project";

const PROJECTS_COLLECTION = "projects";

export const createProject = async (
  data: CreateProjectData,
  authorId: string,
  authorName: string
): Promise<Project> => {
  const projectData = {
    ...data,
    authorId,
    authorName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, PROJECTS_COLLECTION), projectData);
  const docSnap = await getDoc(docRef);

  return {
    id: docRef.id,
    ...docSnap.data(),
    createdAt: docSnap.data()?.createdAt?.toDate() || new Date(),
    updatedAt: docSnap.data()?.updatedAt?.toDate() || new Date(),
  } as Project;
};

export const updateProject = async (
  projectId: string,
  data: UpdateProjectData
): Promise<void> => {
  const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
  await updateDoc(projectRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteProject = async (projectId: string): Promise<void> => {
  const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
  await deleteDoc(projectRef);
};

export const getProject = async (projectId: string): Promise<Project | null> => {
  const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
  const docSnap = await getDoc(projectRef);

  if (!docSnap.exists()) {
    return null;
  }

  return {
    id: docSnap.id,
    ...docSnap.data(),
    createdAt: docSnap.data()?.createdAt?.toDate() || new Date(),
    updatedAt: docSnap.data()?.updatedAt?.toDate() || new Date(),
  } as Project;
};

export const getUserProjects = async (userId: string): Promise<Project[]> => {
  const q = query(
    collection(db, PROJECTS_COLLECTION),
    where("authorId", "==", userId),
    orderBy("createdAt", "desc")
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data()?.createdAt?.toDate() || new Date(),
    updatedAt: doc.data()?.updatedAt?.toDate() || new Date(),
  })) as Project[];
};

export const getAllProjects = async (): Promise<Project[]> => {
  const q = query(
    collection(db, PROJECTS_COLLECTION),
    orderBy("createdAt", "desc")
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data()?.createdAt?.toDate() || new Date(),
    updatedAt: doc.data()?.updatedAt?.toDate() || new Date(),
  })) as Project[];
}; 