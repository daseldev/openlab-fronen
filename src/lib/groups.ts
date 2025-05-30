import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, updateDoc, arrayUnion, arrayRemove, setDoc, addDoc, Timestamp, query, where } from "firebase/firestore";

const GROUPS_COLLECTION = "groups";

export async function getAllGroups() {
  const snapshot = await getDocs(collection(db, GROUPS_COLLECTION));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getGroupById(groupId: string) {
  const groupDoc = await getDoc(doc(db, GROUPS_COLLECTION, groupId));
  if (!groupDoc.exists()) return null;
  return { id: groupDoc.id, ...groupDoc.data() };
}

export async function joinGroup(groupId: string, userId: string) {
  const groupRef = doc(db, GROUPS_COLLECTION, groupId);
  await updateDoc(groupRef, { members: arrayUnion(userId) });
}

export async function leaveGroup(groupId: string, userId: string) {
  const groupRef = doc(db, GROUPS_COLLECTION, groupId);
  await updateDoc(groupRef, { members: arrayRemove(userId) });
}

export async function createGroup(groupId: string, name: string, description: string, creatorId: string) {
  const groupRef = doc(db, GROUPS_COLLECTION, groupId);
  await setDoc(groupRef, {
    name,
    description,
    members: [creatorId],
    createdAt: new Date().toISOString(),
    createdBy: creatorId,
    associatedProjects: [],
  });
}

// --- DISCUSIONES ---
export async function getGroupDiscussions(groupId: string) {
  const discussionsRef = collection(db, GROUPS_COLLECTION, groupId, "discussions");
  const snapshot = await getDocs(discussionsRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function createGroupDiscussion(groupId: string, title: string, content: string, authorId: string, authorName: string) {
  const discussionsRef = collection(db, GROUPS_COLLECTION, groupId, "discussions");
  await addDoc(discussionsRef, {
    title,
    content,
    authorId,
    authorName,
    createdAt: Timestamp.now(),
  });
}

// --- ASOCIAR PROYECTOS ---
export async function associateProjectToGroup(groupId: string, projectId: string) {
  const groupRef = doc(db, GROUPS_COLLECTION, groupId);
  await updateDoc(groupRef, { associatedProjects: arrayUnion(projectId) });
}

export async function removeProjectFromGroup(groupId: string, projectId: string) {
  const groupRef = doc(db, GROUPS_COLLECTION, groupId);
  await updateDoc(groupRef, { associatedProjects: arrayRemove(projectId) });
}

// --- COMENTARIOS EN DISCUSIONES ---
export async function getDiscussionComments(groupId: string, discussionId: string) {
  const commentsRef = collection(db, GROUPS_COLLECTION, groupId, "discussions", discussionId, "comments");
  const snapshot = await getDocs(commentsRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function createDiscussionComment(groupId: string, discussionId: string, content: string, authorId: string, authorName: string) {
  const commentsRef = collection(db, GROUPS_COLLECTION, groupId, "discussions", discussionId, "comments");
  await addDoc(commentsRef, {
    content,
    authorId,
    authorName,
    createdAt: Timestamp.now(),
  });
} 