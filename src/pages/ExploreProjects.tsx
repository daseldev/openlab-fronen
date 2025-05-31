import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Project } from "@/types/project";
import {
  getAllProjects,
  likeProject,
  unlikeProject,
  getProjectComments,
  addProjectComment,
  saveProject,
  unsaveProject,
} from "@/lib/projects";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import ProjectCard from "@/components/projects/ProjectCard";

const ExploreProjects = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [showLoginModal, setShowLoginModal] = useState(false);

  const [loadingLikeProjectIds, setLoadingLikeProjectIds] = useState<string[]>([]);
  const [loadingSaveProjectIds, setLoadingSaveProjectIds] = useState<string[]>([]);

  // Comentarios
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [comments, setComments] = useState<
    Array<{ id: string; authorId: string; authorName: string; content: string; createdAt: Date }>
  >([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  // Conteo de comentarios por proyecto
  const [commentsCountByProject, setCommentsCountByProject] = useState<{ [projectId: string]: number }>({});

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    const filtered = projects.filter(
      (project) =>
        project.visible &&
        (project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.authorName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredProjects(filtered);
  }, [searchQuery, projects]);

  const loadCommentsCount = async (projectIds: string[]) => {
    const counts: { [projectId: string]: number } = {};
    for (const id of projectIds) {
      try {
        const commentsData = await getProjectComments(id);
        counts[id] = commentsData.length;
      } catch {
        counts[id] = 0;
      }
    }
    setCommentsCountByProject(counts);
  };

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const allProjects = await getAllProjects();
      const projectsWithDefaults = allProjects.map((p) => ({
        ...p,
        likedBy: p.likedBy || [],
        likes: p.likes || 0,
      }));
      const onlyVisible = projectsWithDefaults.filter((p) => p.visible);
      setProjects(onlyVisible);
      setFilteredProjects(onlyVisible);

      const projectIds = onlyVisible.map((p) => p.id);
      await loadCommentsCount(projectIds);
    } catch (error) {
      console.error("Error loading projects:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los proyectos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
      toast({
        title: "Error",
        description: "No se pudo actualizar el guardado. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setLoadingSaveProjectIds((prev) => prev.filter((id) => id !== projectId));
    }
  };

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  return (
    <>
      <div className="container mx-auto py-8">
        <div className="flex flex-col space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-4">Explorar Proyectos</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar proyectos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No se encontraron proyectos que coincidan con tu búsqueda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => {
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
        </div>
      </div>

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

          <div className="max-h-96 overflow-y-auto mb-4 space-y-3">
            {loadingComments ? (
              <p className="text-center text-gray-500">Cargando comentarios...</p>
            ) : comments.length === 0 ? (
              <p className="text-center text-gray-500">No hay comentarios aún.</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="border p-3 rounded">
                  <div className="text-sm font-semibold">{comment.authorName}</div>
                  <div className="text-xs text-gray-500 mb-1">{comment.createdAt.toLocaleString()}</div>
                  <div>{comment.content}</div>
                </div>
              ))
            )}
          </div>

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
    </>
  );
};

export default ExploreProjects;
