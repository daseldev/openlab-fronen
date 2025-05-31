import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, Timestamp, collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Linkedin, Github, Instagram } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Mail, Phone, Globe } from "lucide-react";
import UserFavorites from "./UserFavorites";
import { getAllProjects } from "@/lib/projects";
import { format } from "date-fns";

interface userActions {
  id: string;
  actionType: string;
  description: string;
  timestamp: any; // Firestore timestamp
}

const ViewProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [followers, setFollowers] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [modalType, setModalType] = useState<"followers" | "following" | null>(null);
  const [modalUsers, setModalUsers] = useState<any[]>([]);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  // Nueva info para perfil privado
  const [projectsCount, setProjectsCount] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);
  const [lastActivity, setLastActivity] = useState<Date | null>(null);

  // Estado para la línea de tiempo
  const [actions, setActions] = useState<userActions[]>([]);
  const [loadingActions, setLoadingActions] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfile(data);
          setFollowers(data.followers || []);
          setFollowing(data.following || []);
        }

        // Si es perfil propio, cargar datos extra
        if (currentUser && currentUser.uid === userId) {
          const allProjects = await getAllProjects();
          const userProjects = allProjects.filter(p => p.authorId === userId);
          setProjectsCount(userProjects.length);
          setTotalLikes(userProjects.reduce((acc, p) => acc + (p.likes || 0), 0));
          if (userProjects.length > 0) {
            const latestProject = userProjects.reduce((latest, current) => {
              if (!latest) return current;
              return current.createdAt > latest.createdAt ? current : latest;
            }, null as null | typeof userProjects[0]);
            setLastActivity(latestProject ? latestProject.createdAt : null);
          } else {
            setLastActivity(null);
          }
        }
      } catch (error) {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  useEffect(() => {
  const fetchUserActions = async () => {
    if (!userId) return;
    setLoadingActions(true);
    try {
      const actionsRef = collection(db, "userActions");
      const q = query(
        actionsRef,
        where("userId", "==", userId),
        orderBy("timestamp", "desc"),
        limit(10)
      );
      const querySnapshot = await getDocs(q);
      const actionsData: userActions[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<userActions, "id">)
      }));
      setActions(actionsData);
    } catch (error) {
      console.error("Error fetching user actions:", error);
      setActions([]);
    } finally {
      setLoadingActions(false);
    }
  };
  fetchUserActions();
}, [userId]);

  // Función para seguir/dejar de seguir desde el modal
  const handleModalFollow = async (targetUid: string, isFollowingUser: boolean) => {
    if (!currentUser || currentUser.uid === targetUid) return;
    try {
      const targetRef = doc(db, "users", targetUid);
      const currentUserRef = doc(db, "users", currentUser.uid);
      if (isFollowingUser) {
        await updateDoc(targetRef, { followers: arrayRemove(currentUser.uid) });
        await updateDoc(currentUserRef, { following: arrayRemove(targetUid) });
        // Actualizar modalUsers y following localmente
        setFollowing(following.filter((f) => f !== targetUid));
        setModalUsers((prev) => prev.map(u => u.uid === targetUid ? { ...u, _isFollowing: false } : u));
      } else {
        await updateDoc(targetRef, { followers: arrayUnion(currentUser.uid) });
        await updateDoc(currentUserRef, { following: arrayUnion(targetUid) });
        setFollowing([...following, targetUid]);
        setModalUsers((prev) => prev.map(u => u.uid === targetUid ? { ...u, _isFollowing: true } : u));
      }
    } catch {}
  };

  // Al cargar usuarios para el modal, marcar si ya los sigues
  const fetchModalUsers = async (uids: string[]) => {
    const users: any[] = [];
    for (const uid of uids) {
      try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
          users.push({ uid, ...userDoc.data(), _isFollowing: following.includes(uid) });
        }
      } catch {}
    }
    setModalUsers(users);
  };

  const isFollowing = currentUser && followers.includes(currentUser.uid);
  const isOwnProfile = currentUser?.uid === userId;

  const handleFollow = async () => {
    if (!currentUser || isOwnProfile) return;
    setIsFollowLoading(true);
    try {
      const userRef = doc(db, "users", userId!);
      const currentUserRef = doc(db, "users", currentUser.uid);
      if (isFollowing) {
        // Dejar de seguir
        await updateDoc(userRef, { followers: arrayRemove(currentUser.uid) });
        await updateDoc(currentUserRef, { following: arrayRemove(userId) });
        setFollowers(followers.filter((f) => f !== currentUser.uid));
      } else {
        // Seguir
        await updateDoc(userRef, { followers: arrayUnion(currentUser.uid) });
        await updateDoc(currentUserRef, { following: arrayUnion(userId) });
        setFollowers([...followers, currentUser.uid]);
      }
    } catch (e) {
      // Manejar error
    } finally {
      setIsFollowLoading(false);
    }
  };

  const openModal = (type: "followers" | "following") => {
    setModalType(type);
    fetchModalUsers(type === "followers" ? followers : following);
  };

  const closeModal = () => {
    setModalType(null);
    setModalUsers([]);
  };

  const getUserInitials = () => {
    if (profile?.displayName) {
      return profile.displayName
        .split(" ")
        .map((name: string) => name[0])
        .join("");
    }
    return profile?.email?.charAt(0).toUpperCase() || "U";
  };

  if (loading) {
    return <div className="text-center py-10">Cargando perfil...</div>;
  }
  if (!profile) {
    return <div className="text-center py-10">Perfil no encontrado.</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header tipo LinkedIn */}
      <div className="relative w-full h-48 bg-gradient-to-r from-blue-900 to-blue-600">
        {/* Avatar superpuesto */}
        <div className="absolute left-1/2 -bottom-16 transform -translate-x-1/2">
          <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
            <AvatarImage src={profile.photoURL} />
            <AvatarFallback className="text-4xl">{getUserInitials()}</AvatarFallback>
          </Avatar>
        </div>
      </div>
      {/* Botón Editar perfil y proyectos */}
      {isOwnProfile && (
        <div className="flex justify-end w-full px-8 mt-4 gap-4">
          <Button
            className="shadow-lg bg-white/90 text-black hover:bg-white"
            onClick={() => navigate("/profile/edit")}
          >
            Editar perfil
          </Button>
          <Button
            className="shadow-lg bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => navigate("/my-projects")}
          >
            Mis Proyectos
          </Button>
        </div>
      )}
      {!isOwnProfile && (
        <div className="flex justify-end w-full px-8 mt-4 gap-4">
          <Button
            className="shadow-lg bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => navigate(`/user/${userId}/projects`)}
          >
            Ver Proyectos
          </Button>
          <Button
            variant={isFollowing ? "outline" : "default"}
            disabled={isFollowLoading}
            onClick={handleFollow}
          >
            {isFollowing ? "Dejar de seguir" : "Seguir"}
          </Button>
        </div>
      )}
      <div className="pt-20 pb-8 max-w-2xl mx-auto">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-3xl font-bold">{profile.displayName || "Sin nombre"}</h1>
          {profile.headline && (
            <div className="text-lg text-muted-foreground mt-1">{profile.headline}</div>
          )}
          {profile.location && (
            <div className="text-sm text-muted-foreground mt-1">{profile.location}</div>
          )}

          {/* NUEVA SECCIÓN: Datos perfil privado */}
          {isOwnProfile && (
            <div className="mt-6 flex gap-8 text-center">
              <div>
                <div className="text-2xl font-bold">{projectsCount}</div>
                <div className="text-muted-foreground">Proyectos</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{totalLikes}</div>
                <div className="text-muted-foreground">Likes recibidos</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {lastActivity ? format(lastActivity, "dd/MM/yyyy") : "—"}
                </div>
                <div className="text-muted-foreground">Última actividad</div>
              </div>
            </div>
          )}

          {/* Línea de tiempo: acciones recientes */}
          {(
            <div className="mt-10 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Actividad Reciente</h2>
              {loadingActions ? (
                <p>Cargando actividades...</p>
              ) : actions.length === 0 ? (
                <p className="text-muted-foreground">No hay actividades recientes.</p>
              ) : (
                <ul className="space-y-4">
                  {actions.map(({ id, description, timestamp }) => (
                    <li
                      key={id}
                      className="border-l-2 border-blue-600 pl-4 relative"
                    >
                      <span className="absolute -left-3 top-1.5 w-6 h-6 rounded-full bg-blue-600"></span>
                      <div className="text-gray-700">{description}</div>
                      <div className="text-xs text-gray-500">
                        {format(timestamp.toDate(), "dd/MM/yyyy")}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          
          {/* Seguidores/Seguidos */}
          <div className="flex gap-6 mt-4">
            <button className="text-blue-600 hover:underline font-medium" onClick={() => openModal("followers")}>{followers.length} seguidores</button>
            <button className="text-blue-600 hover:underline font-medium" onClick={() => openModal("following")}>{following.length} seguidos</button>
          </div>
          {/* Modal seguidores/seguidos */}
          <Dialog open={!!modalType} onOpenChange={closeModal}>
            <DialogContent className="max-w-md mx-auto">
              <h2 className="text-xl font-bold mb-4">{modalType === "followers" ? "Seguidores" : "Seguidos"}</h2>
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {modalUsers.length === 0 ? (
                  <div className="text-muted-foreground">No hay usuarios.</div>
                ) : (
                  modalUsers.map((user) => (
                    <div key={user.uid} className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.photoURL} />
                        <AvatarFallback>{user.displayName?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.displayName || user.email}</span>
                      <Button size="sm" variant="link" onClick={() => { navigate(`/profile/${user.uid}`); closeModal(); }}>Ver perfil</Button>
                      {currentUser && currentUser.uid !== user.uid && (
                        user._isFollowing ? (
                          <Button size="sm" variant="outline" onClick={() => handleModalFollow(user.uid, true)}>
                            Siguiendo
                          </Button>
                        ) : (
                          <Button size="sm" onClick={() => handleModalFollow(user.uid, false)}>
                            Seguir
                          </Button>
                        )
                      )}
                    </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
          {/* Hipervínculo Información de contacto */}
          <div className="flex justify-center mt-6">
            <Dialog>
              <DialogTrigger asChild>
                <button className="underline text-blue-500 hover:text-blue-700 font-medium text-lg cursor-pointer">Información de contacto</button>
              </DialogTrigger>
              <DialogContent className="max-w-md mx-auto">
                <h2 className="text-xl font-bold mb-4">Información de contacto</h2>
                <div className="space-y-4">
                  {profile.contactInfo && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-gray-500" />
                      <span>{profile.contactInfo}</span>
                    </div>
                  )}
                  {profile.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-gray-500" />
                      <span>{profile.email}</span>
                    </div>
                  )}
                  {profile.linkedin && (
                    <div className="flex items-center gap-3">
                      <Linkedin className="h-5 w-5 text-[#0A66C2]" />
                      <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">LinkedIn</a>
                    </div>
                  )}
                  {profile.github && (
                    <div className="flex items-center gap-3">
                      <Github className="h-5 w-5 text-[#181717]" />
                      <a href={profile.github} target="_blank" rel="noopener noreferrer" className="text-gray-900 dark:text-gray-100 hover:underline">GitHub</a>
                    </div>
                  )}
                  {profile.instagram && (
                    <div className="flex items-center gap-3">
                      <Instagram className="h-5 w-5 text-pink-500" />
                      <a href={profile.instagram} target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:underline">Instagram</a>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        {/* Info lateral tipo LinkedIn */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="space-y-2">
            {profile.techStack && (
              <div>
                <span className="font-semibold">Stack tecnológico:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {profile.techStack.split(",").map((tech: string, idx: number) => (
                    <Badge key={idx} variant="secondary">{tech.trim()}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Acerca de */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-2">Acerca de</h2>
          <div className="bg-muted rounded-lg p-4 min-h-[80px]">
            {profile.bio || <span className="text-muted-foreground">Sin información</span>}
          </div>
        </div>
        {/* Sección Estudios */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <svg className="h-6 w-6 text-blue-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 14l9-5-9-5-9 5 9 5z"/><path d="M12 14l6.16-3.422A12.083 12.083 0 0 1 21 13.5c0 2.485-4.03 4.5-9 4.5s-9-2.015-9-4.5c0-.538.214-1.05.84-1.922L12 14z"/></svg>
            Estudios
          </h2>
          <div className="space-y-4">
            {(profile.education && profile.education.length > 0) ? profile.education.map((edu: any, idx: number) => (
              <div key={idx} className="bg-white dark:bg-zinc-900 rounded-lg shadow p-4">
                <div className="font-semibold text-lg">{edu.degree || "Título"}</div>
                <div className="text-muted-foreground">{edu.institution || "Institución"} {edu.years && <span>• {edu.years}</span>}</div>
                {edu.description && <div className="mt-2 text-sm">{edu.description}</div>}
              </div>
            )) : <div className="text-muted-foreground">Sin estudios añadidos.</div>}
          </div>
        </div>
        {/* Sección Experiencia */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3v4M8 3v4M2 11h20"/></svg>
            Experiencia
          </h2>
          <div className="space-y-4">
            {(profile.experience && profile.experience.length > 0) ? profile.experience.map((exp: any, idx: number) => (
              <div key={idx} className="bg-white dark:bg-zinc-900 rounded-lg shadow p-4">
                <div className="font-semibold text-lg">{exp.position || "Puesto"}</div>
                <div className="text-muted-foreground">{exp.company || "Empresa"} {exp.years && <span>• {exp.years}</span>}</div>
                {exp.description && <div className="mt-2 text-sm">{exp.description}</div>}
              </div>
            )) : <div className="text-muted-foreground">Sin experiencia añadida.</div>}
          </div>
        </div>
        {/* Sección Idiomas */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20v-6M12 4v2m0 0a8 8 0 1 1-8 8"/></svg>
            Idiomas
          </h2>
          <div className="flex flex-wrap gap-3 mt-2">
            {(profile.languages && profile.languages.length > 0) ? profile.languages.map((lang: any, idx: number) => (
              <span key={idx} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100 font-medium shadow">
                <span>{lang.language}</span>
                <span className="text-xs bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded px-2 py-0.5">{lang.level}</span>
              </span>
            )) : <span className="text-muted-foreground">Sin idiomas añadidos.</span>}
          </div>
        </div>
        {/* Proyectos guardados solo si es mi perfil */}
          {currentUser?.uid === userId && (
            <div className="mt-10">
              <UserFavorites />
            </div>
          )}
      </div>
    </div>
  );
};

export default ViewProfile; 