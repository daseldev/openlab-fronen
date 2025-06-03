import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  arrayUnion, 
  arrayRemove,
  getDoc, 
  increment,
  Timestamp
} from "firebase/firestore";
import { db } from "./firebase";
import { Project, CreateProjectData, UpdateProjectData } from "@/types/project";
import { logUserAction } from "./userActions";

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

  await logUserAction(authorId, "create_project", `Creó el proyecto '${data.title}'`);

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

export const getProjectWithLikeInfo = async (projectId: string, userId: string): Promise<Project & { likedByUser: boolean }> => {
  const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
  const docSnap = await getDoc(projectRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  const likedBy: string[] = data.likedBy || [];
  const likedByUser = likedBy.includes(userId);

  return {
    id: docSnap.id,
    ...data,
    likedByUser,
    likes: data.likes || 0,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as unknown as Project & { likedByUser: boolean };
};


export const getUserProjects = async (userId: string): Promise<Project[]> => {
  const q = query(
    collection(db, PROJECTS_COLLECTION),
    where("authorId", "==", userId),
    orderBy("createdAt", "desc")
  );

  const querySnapshot = await getDocs(q);

  // Modificación: contar comentarios para cada proyecto
  const projectsWithComments = await Promise.all(
    querySnapshot.docs.map(async (doc) => {
      const data = doc.data();
      // Contar comentarios en la subcolección "comments"
      const commentsCol = collection(db, PROJECTS_COLLECTION, doc.id, "comments");
      const commentsSnapshot = await getDocs(commentsCol);
      return {
        id: doc.id,
        ...data,
        createdAt: data?.createdAt?.toDate() || new Date(),
        updatedAt: data?.updatedAt?.toDate() || new Date(),
        commentsCount: commentsSnapshot.size, // cantidad de comentarios
      } as Project & { commentsCount: number };
    })
  );

  return projectsWithComments;
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

export async function likeProject(projectId: string, userId: string): Promise<void> {
  const projectRef = doc(db, "projects", projectId);
  const projectSnap = await getDoc(projectRef);

  if (!projectSnap.exists()) {
    throw new Error("Proyecto no encontrado");
  }

  const projectData = projectSnap.data();
  const likedBy = projectData?.likedBy || [];

  if (likedBy.includes(userId)) {
    // Usuario ya dio like, no hacer nada o lanzar error
    throw new Error("Ya has dado like a este proyecto");
  }

  // Actualizar: incrementar likes y agregar userId a likedBy
  await updateDoc(projectRef, {
    likes: increment(1),
    likedBy: arrayUnion(userId),
  });

  await logUserAction(userId, "liked_project", `Le dio like al proyecto '${projectData.title}'`);
}

export async function unlikeProject(projectId: string, userId: string): Promise<void> {
  const projectRef = doc(db, "projects", projectId);
  const projectSnap = await getDoc(projectRef);

  if (!projectSnap.exists()) {
    throw new Error("Proyecto no encontrado");
  }

  const projectData = projectSnap.data();
  const likedBy = projectData?.likedBy || [];

  if (!likedBy.includes(userId)) {
    // Usuario no ha dado like aún
    throw new Error("No has dado like a este proyecto");
  }

  // Actualizar: decrementar likes y remover userId de likedBy
  await updateDoc(projectRef, {
    likes: increment(-1),
    likedBy: arrayRemove(userId),
  });
}

export async function getProjectComments(projectId: string) {
  const commentsRef = collection(db, PROJECTS_COLLECTION, projectId, "comments");
  const q = query(commentsRef, orderBy("createdAt", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  }));
}

export async function addProjectComment(
  projectId: string,
  authorId: string,
  authorName: string,
  content: string
) {
  const commentsRef = collection(db, PROJECTS_COLLECTION, projectId, "comments");
  await addDoc(commentsRef, {
    authorId,
    authorName,
    content,
    createdAt: Timestamp.now(),
  });

  await logUserAction(authorId, "add_comment", `Comentó: '${content}'`);
}

export async function saveProject(projectId: string, userId: string): Promise<void> {
  const projectRef = doc(db, "projects", projectId);
  const projectSnap = await getDoc(projectRef);

  if (!projectSnap.exists()) throw new Error("Proyecto no encontrado");

  const savedBy = projectSnap.data()?.savedBy || [];

  if (savedBy.includes(userId)) {
    throw new Error("Ya has guardado este proyecto");
  }

  await updateDoc(projectRef, {
    savedBy: arrayUnion(userId),
    saves: increment(1),
  });
}

export async function unsaveProject(projectId: string, userId: string): Promise<void> {
  const projectRef = doc(db, "projects", projectId);
  const projectSnap = await getDoc(projectRef);

  if (!projectSnap.exists()) throw new Error("Proyecto no encontrado");

  const savedBy = projectSnap.data()?.savedBy || [];

  if (!savedBy.includes(userId)) {
    throw new Error("No has guardado este proyecto");
  }

  await updateDoc(projectRef, {
    savedBy: arrayRemove(userId),
    saves: increment(-1),
  });
}

export const getSavedProjectsByUser = async (userId: string): Promise<Project[]> => {
  const projectsRef = collection(db, "projects");
  const q = query(projectsRef, where("savedBy", "array-contains", userId));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title,
      description: data.description,
      category: data.category,
      authorId: data.authorId,
      authorName: data.authorName,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      visible: data.visible,
      likes: data.likes || 0,
      likedBy: data.likedBy || [],
      saves: data.saves || 0,
      savedBy: data.savedBy || [],
    } as Project;
  });
};


export const getProjectLikesDetailed = async (projectId: string) => {
  try {
    // 1. Traer el documento proyecto
    const projectDocRef = doc(db, "projects", projectId);
    const projectSnap = await getDoc(projectDocRef);

    if (!projectSnap.exists()) return [];

    const projectData = projectSnap.data();

    if (!projectData.likedBy || projectData.likedBy.length === 0) return [];

    // 2. Por cada userId en likedBy, buscar usuario y su nombre
    const likedUserIds = projectData.likedBy;

    const usersCol = collection(db, "users");
    // Consulta para traer solo los usuarios con IDs en likedUserIds
    const q = query(usersCol, where("__name__", "in", likedUserIds));

    const querySnapshot = await getDocs(q);

    const usersList = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.displayName || data.email || "Usuario desconocido",
      };
    });

    return usersList;
  } catch (error) {
    console.error("Error fetching detailed likes:", error);
    return [];
  }
};