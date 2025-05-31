import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Project } from "@/types/project";
import { getAllProjects, getProjectComments, likeProject, unlikeProject, saveProject, unsaveProject, addProjectComment } from "@/lib/projects";
import { useAuth } from "@/contexts/AuthContext";
import ProjectCard from "@/components/projects/ProjectCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const UserProjects = () => {
  const { userId } = useParams<{ userId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [userName, setUserName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const isMyProjects = location.pathname === "/my-projects";

  // Estado para manejar likes, saves y comentarios
  const [loadingLikeProjectIds, setLoadingLikeProjectIds] = useState<string[]>([]);
  const [loadingSaveProjectIds, setLoadingSaveProjectIds] = useState<string[]>([]);

  const [showLoginModal, setShowLoginModal] = useState(false);

  // Comentarios
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [comments, setComments] = useState<
    Array<{
      id: string;
      authorId: string;
      authorName: string;
      content: string;
      createdAt: Date;
    }>
  >([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  // Conteo de comentarios por proyecto
  const [commentsCountByProject, setCommentsCountByProject] = useState<{ [projectId: string]: number }>({});

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        let targetUserId = userId;
        let showAllProjects = false;

        if (isMyProjects) {
          targetUserId = currentUser?.uid;
          showAllProjects = true;
        }

        if (!targetUserId) return;

        // Obtener información del usuario
        const userDoc = await getDoc(doc(db, "users", targetUserId));
        if (userDoc.exists()) {
          setUserName(userDoc.data().displayName || "Usuario");
        }

        // Obtener proyectos
        const allProjects = await getAllProjects();
        const userProjects = allProjects.filter(
          (project) =>
            project.authorId === targetUserId &&
            (showAllProjects || project.visible)
        );
        setProjects(userProjects);

        // Cargar conteo de comentarios para cada proyecto
        const counts: { [projectId: string]: number } = {};
        for (const p of userProjects) {
          try {
            const commentsData = await getProjectComments(p.id);
            counts[p.id] = commentsData.length;
          } catch {
            counts[p.id] = 0;
          }
        }
        setCommentsCountByProject(counts);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId, currentUser, isMyProjects]);

  const openCommentsModal = async (projectId: string) => {
    setActiveProjectId(projectId);
    setShowCommentsModal(true);
    setLoadingComments(true);

    try {
      const commentsData = await getProjectComments(projectId);
      setComments(
        commentsData.map((c: any) => ({
          id: c.id,
          authorId: c.authorId,
          authorName: c.authorName,
          content: c.content,
          createdAt: c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt),
        }))
      );
    } catch (error) {
      // Aquí podrías mostrar toast
      console.error("No se pudieron cargar los comentarios.");
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!currentUser) {
      setShowLoginModal(true);
      return;
    }
    if (!newComment.trim() || !activeProjectId) return;

    setIsSubmittingComment(true);
    try {
      await addProjectComment(
        activeProjectId,
        currentUser.uid,
        currentUser.displayName || currentUser.email || "Usuario",
        newComment.trim()
      );
      // Recarga comentarios
      const updatedComments = await getProjectComments(activeProjectId);
      setComments(
        updatedComments.map((c: any) => ({
          id: c.id,
          authorId: c.authorId,
          authorName: c.authorName,
          content: c.content,
          createdAt: c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt),
        }))
      );
      setNewComment("");
      // Aquí podrías mostrar toast
      setCommentsCountByProject((prev) => ({
        ...prev,
        [activeProjectId]: (prev[activeProjectId] || 0) + 1,
      }));
    } catch (error) {
      // Aquí podrías mostrar toast
      console.error("No se pudo agregar el comentario.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleLikeToggle = async (projectId: string) => {
    if (!currentUser) {
      setShowLoginModal(true);
      return;
    }

    const userId = currentUser.uid;
    const projectIndex = projects.findIndex((p) => p.id === projectId);
    if (projectIndex === -1) return;

    const project = projects[projectIndex];
    const likedBy = project.likedBy || [];
    const hasLiked = likedBy.includes(userId);

    setLoadingLikeProjectIds((prev) => [...prev, projectId]);

    try {
      if (hasLiked) {
        await unlikeProject(projectId, userId);
        const updatedProjects = [...projects];
        updatedProjects[projectIndex] = {
          ...project,
          likedBy: likedBy.filter((id) => id !== userId),
          likes: (project.likes || 1) - 1,
        };
        setProjects(updatedProjects);
      } else {
        await likeProject(projectId, userId);
        const updatedProjects = [...projects];
        updatedProjects[projectIndex] = {
          ...project,
          likedBy: [...likedBy, userId],
          likes: (project.likes || 0) + 1,
        };
        setProjects(updatedProjects);
      }
    } catch (error) {
      console.error("No se pudo actualizar el like.");
    } finally {
      setLoadingLikeProjectIds((prev) => prev.filter((id) => id !== projectId));
    }
  };

  const handleSaveToggle = async (projectId: string) => {
    if (!currentUser) {
      setShowLoginModal(true);
      return;
    }

    const userId = currentUser.uid;
    const projectIndex = projects.findIndex((p) => p.id === projectId);
    if (projectIndex === -1) return;

    const project = projects[projectIndex];
    const savedBy = project.savedBy || [];
    const hasSaved = savedBy.includes(userId);

    setLoadingSaveProjectIds((prev) => [...prev, projectId]);

    try {
      if (hasSaved) {
        await unsaveProject(projectId, userId);
        const updatedProjects = [...projects];
        updatedProjects[projectIndex] = {
          ...project,
          savedBy: savedBy.filter((id) => id !== userId),
          saves: (project.saves || 1) - 1,
        };
        setProjects(updatedProjects);
      } else {
        await saveProject(projectId, userId);
        const updatedProjects = [...projects];
        updatedProjects[projectIndex] = {
          ...project,
          savedBy: [...savedBy, userId],
          saves: (project.saves || 0) + 1,
        };
        setProjects(updatedProjects);
      }
    } catch (error) {
      console.error("No se pudo actualizar el guardado.");
    } finally {
      setLoadingSaveProjectIds((prev) => prev.filter((id) => id !== projectId));
    }
  };

  if (isLoading) {
    return <div className="text-center py-10">Cargando proyectos...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">
          {isMyProjects ? "Mis Proyectos" : `Proyectos de ${userName}`}
        </h1>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-2">
            No hay proyectos disponibles
          </h2>
          <p className="text-muted-foreground">
            {isMyProjects
              ? "Aún no has creado ningún proyecto."
              : "Este usuario aún no ha compartido ningún proyecto público."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const loadingLike = loadingLikeProjectIds.includes(project.id || "");
            const loadingSave = loadingSaveProjectIds.includes(project.id || "");
            return (
              <ProjectCard
                key={project.id}
                project={project}
                currentUser={currentUser}
                loadingLike={loadingLike}
                loadingSave={loadingSave}
                onLikeToggle={handleLikeToggle}
                onSaveToggle={handleSaveToggle}
                onOpenComments={openCommentsModal}
                navigateToProject={(id) => navigate(`/projects/${id}`)}
                commentsCount={commentsCountByProject[project.id] || 0}
              />
            );
          })}
        </div>
      )}

      {/* Modal de login */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Acceso denegado</DialogTitle>
          </DialogHeader>
          <div className="mb-4">Debes iniciar sesión para hacer eso.</div>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button onClick={() => setShowLoginModal(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de comentarios */}
      <Dialog open={showCommentsModal} onOpenChange={setShowCommentsModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Comentarios</DialogTitle>
          </DialogHeader>

          {/* Lista de comentarios */}
          <div className="max-h-96 overflow-y-auto mb-4 space-y-3">
            {loadingComments ? (
              <p className="text-center text-gray-500">Cargando comentarios...</p>
            ) : comments.length === 0 ? (
              <p className="text-center text-gray-500">No hay comentarios aún.</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="border p-3 rounded">
                  <div className="text-sm font-semibold">{comment.authorName}</div>
                  <div className="text-xs text-gray-500 mb-1">
                    {comment.createdAt.toLocaleString()}
                  </div>
                  <div>{comment.content}</div>
                </div>
              ))
            )}
          </div>

          {/* Campo para agregar nuevo comentario */}
          <div className="flex space-x-2">
            <Input
              placeholder={
                currentUser ? "Escribe un comentario..." : "Inicia sesión para comentar"
              }
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={!currentUser || isSubmittingComment}
            />
            <Button
              onClick={handleAddComment}
              disabled={!currentUser || isSubmittingComment || !newComment.trim()}
            >
              {isSubmittingComment ? "Enviando..." : "Enviar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserProjects;
