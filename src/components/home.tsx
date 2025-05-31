import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { SearchIcon, Heart, MessageCircle, Bookmark, BookmarkMinus } from "lucide-react";
import { addProjectComment, getAllProjects, getProjectComments, likeProject, saveProject, unlikeProject, unsaveProject } from "@/lib/projects";
import { Project } from "@/types/project";
import { Badge } from "@/components/ui/badge";
import ProjectCard from "@/components/projects/ProjectCard";

const CATEGORIES = [
  "Datos",
  "Desarrollo Web",
  "Desarrollo Móvil",
  "Inteligencia Artificial",
  "Redes",
  "Seguridad",
  "IoT",
  "Cloud",
  "Videojuegos",
  "Robótica",
  "Otro",
];

const Home = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Todos");
  const navigate = useNavigate();

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
    const fetchProjects = async () => {
      try {
        const allProjects = await getAllProjects();
        const onlyVisible = allProjects.filter((p) => p.visible);
        setProjects(onlyVisible);

        // Cargar conteo de comentarios
        const counts: { [projectId: string]: number } = {};
        for (const p of onlyVisible) {
          try {
            const commentsData = await getProjectComments(p.id);
            counts[p.id] = commentsData.length;
          } catch {
            counts[p.id] = 0;
          }
        }
        setCommentsCountByProject(counts);
      } catch (error) {
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, []);

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

  const filteredProjects = projects.filter(
    (project) =>
      (activeTab === "Todos" || project.category === activeTab) &&
      (project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-8">
        {/* Barra de búsqueda solo en Home */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <div className="relative w-full max-w-sm md:w-80">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar proyectos..."
              className="w-full pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        {/* Fin barra de búsqueda */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Explora Proyectos Innovadores
          </h1>
          <p className="text-xl text-muted-foreground">
            Descubre proyectos creativos y comparte tus propias ideas con la
            comunidad
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="mx-auto">
            <TabsTrigger value="Todos">Todos</TabsTrigger>
            {CATEGORIES.map((cat) => (
              <TabsTrigger key={cat} value={cat}>
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="text-center py-12">Cargando proyectos...</div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-2">No se encontraron proyectos</h2>
            <p className="text-muted-foreground">
              Intenta con otra búsqueda o explora todas las categorías
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
      </main>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container py-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">© 2023 Mi OpenLab. Todos los derechos reservados.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Button variant="ghost" size="sm">Acerca de</Button>
            <Button variant="ghost" size="sm">Términos</Button>
            <Button variant="ghost" size="sm">Privacidad</Button>
            <Button variant="ghost" size="sm">Contacto</Button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
