import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAllProjects, getProjectComments, likeProject, unlikeProject, saveProject, unsaveProject, addProjectComment } from "@/lib/projects";
import { Project } from "@/types/project";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

import ProjectCard from "@/components/projects/ProjectCard"; // Ajusta la ruta según tu proyecto
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

const Feed = () => {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [following, setFollowing] = useState<string[]>([]);
  const [loadingLikeProjectIds, setLoadingLikeProjectIds] = useState<string[]>([]);
  const [loadingSaveProjectIds, setLoadingSaveProjectIds] = useState<string[]>([]);

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

  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeed = async () => {
      if (!currentUser) return;
      setIsLoading(true);
      try {
        // Obtener a quién sigo
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        const followingArr = userData.following || [];
        setFollowing(followingArr);
        if (followingArr.length === 0) {
          setProjects([]);
          setIsLoading(false);
          return;
        }
        // Obtener proyectos de los usuarios que sigo
        const allProjects = await getAllProjects();
        const feedProjects = allProjects.filter(
          (p) => p.visible && followingArr.includes(p.authorId)
        );
        setProjects(feedProjects);

        // Cargar conteo de comentarios
        const counts: { [projectId: string]: number } = {};
        for (const p of feedProjects) {
          try {
            const commentsData = await getProjectComments(p.id);
            counts[p.id] = commentsData.length;
          } catch {
            counts[p.id] = 0;
          }
        }
        setCommentsCountByProject(counts);

      } catch (e) {
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFeed();
  }, [currentUser]);

  // Manejo comentarios modal
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
      toast({
        title: "Error",
        description: "No se pudieron cargar los comentarios.",
        variant: "destructive",
      });
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!currentUser) {
      toast({
        title: "Acceso denegado",
        description: "Debes iniciar sesión para comentar.",
        variant: "destructive",
      });
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
      toast({
        title: "Comentario agregado",
        description: "Tu comentario fue agregado correctamente.",
      });
      setCommentsCountByProject((prev) => ({
        ...prev,
        [activeProjectId]: (prev[activeProjectId] || 0) + 1,
      }));
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar el comentario.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleLikeToggle = async (projectId: string) => {
    if (!currentUser) {
      toast({
        title: "Acceso denegado",
        description: "Debes iniciar sesión para dar like.",
        variant: "destructive",
      });
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
      toast({
        title: "Error",
        description: "No se pudo actualizar el like. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setLoadingLikeProjectIds((prev) => prev.filter((id) => id !== projectId));
    }
  };

  const handleSaveToggle = async (projectId: string) => {
    if (!currentUser) {
      toast({
        title: "Acceso denegado",
        description: "Debes iniciar sesión para guardar proyectos.",
        variant: "destructive",
      });
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
      toast({
        title: "Error",
        description: "No se pudo actualizar el guardado. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setLoadingSaveProjectIds((prev) => prev.filter((id) => id !== projectId));
    }
  };

  if (!currentUser) {
    return <div className="text-center py-10">Inicia sesión para ver tu feed.</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Feed Personalizado</h1>

      {isLoading ? (
        <div className="text-center py-10">Cargando...</div>
      ) : following.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          No sigues a nadie todavía. Sigue a otros usuarios para ver sus proyectos aquí.
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          Los usuarios que sigues aún no han publicado proyectos visibles.
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
              placeholder={currentUser ? "Escribe un comentario..." : "Inicia sesión para comentar"}
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

export default Feed;
