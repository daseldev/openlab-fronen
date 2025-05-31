import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Project } from "@/types/project";
import { getProject, deleteProject, getProjectComments, getProjectLikesDetailed } from "@/lib/projects";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { ArrowLeft, Trash2, Heart, MessageCircle, Bookmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ProjectDetail = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Likes y comentarios
  const [likesUsers, setLikesUsers] = useState<{ id: string; name: string }[]>([]);
  const [comments, setComments] = useState<
    Array<{ id: string; authorId: string; authorName: string; content: string; createdAt: Date }>
  >([]);
  const [likesDialogOpen, setLikesDialogOpen] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadProject();
      loadComments();
      loadLikes();
    }
  }, [projectId]);

  const loadProject = async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const projectData = await getProject(projectId);
      if (projectData) {
        setProject(projectData);
      } else {
        toast({
          title: "Error",
          description: "El proyecto no existe.",
          variant: "destructive",
        });
        navigate("/explore");
      }
    } catch (error) {
      console.error("Error loading project:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el proyecto.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadComments = async () => {
    if (!projectId) return;
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
    }
  };

  const loadLikes = async () => {
    if (!projectId) return;
    try {
      // Esta función debe devolver lista [{id, name}]
      const likesList = await getProjectLikesDetailed(projectId);
      setLikesUsers(likesList);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los likes.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!project) return;
    try {
      await deleteProject(project.id);
      toast({
        title: "Proyecto eliminado",
        description: "El proyecto ha sido eliminado exitosamente.",
      });
      navigate("/dashboard");
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el proyecto.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  if (!project) {
    return null;
  }

  const isAuthor = currentUser?.uid === project.authorId;

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl">{project.title}</CardTitle>
                <CardDescription className="mt-2 flex flex-col sm:flex-row sm:items-center sm:gap-2">
                  <div className="mb-2 sm:mb-0">
                    Por{" "}
                    {project.authorId ? (
                      <Link to={`/profile/${project.authorId}`} className="text-blue-600 hover:underline font-medium">
                        {project.authorName}
                      </Link>
                    ) : (
                      <span>{project.authorName}</span>
                    )}{" "}
                    • Creado el {project.createdAt.toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                    <Badge className="bg-muted text-foreground ml-2">{project.category}</Badge>
                  </div>
                </CardDescription>
              </div>
              {isAuthor && (
                <div className="flex space-x-2">
                  <Button variant="outline" size="icon" onClick={() => setDeleteDialogOpen(true)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-lg">{project.description}</p>
            </div>

            {/* Comentarios debajo de la descripción */}
            <div className="mt-6">
              <h3 className="text-xl font-semibold mb-2">Comentarios ({comments.length})</h3>
              {comments.length === 0 ? (
                <p className="text-gray-500">No hay comentarios aún.</p>
              ) : (
                <ul className="space-y-4 max-h-64 overflow-y-auto">
                  {comments.map((comment) => (
                    <li key={comment.id} className="border rounded p-3">
                      <div className="text-sm font-semibold">{comment.authorName}</div>
                      <div className="text-xs text-gray-500 mb-1">
                        {comment.createdAt.toLocaleString()}
                      </div>
                      <div>{comment.content}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>

          <div className="flex items-center justify-between px-6 py-4 border-t">
            <button
              type="button"
              className="flex items-center space-x-1 text-red-600 hover:text-red-700 focus:outline-none"
              onClick={() => setLikesDialogOpen(true)}
            >
              <Heart className="h-5 w-5" />
              <span>{project.likes || 0}</span>
            </button>
            <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-300">
              <MessageCircle className="h-5 w-5" />
              <span>{comments.length}</span>
            </div>
            <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-300">
              <Bookmark className="h-5 w-5" />
              <span>{project.saves || 0}</span>
            </div>
          </div>
        </Card>

        {/* Modal Likes */}
        <Dialog open={likesDialogOpen} onOpenChange={setLikesDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Usuarios que dieron like</DialogTitle>
              <DialogDescription>
                {likesUsers.length === 0 ? "Nadie ha dado like a este proyecto aún." : `Total: ${likesUsers.length}`}
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-64 overflow-y-auto px-4">
              {likesUsers.length === 0 ? (
                <p className="text-center text-gray-500">Sin likes aún.</p>
              ) : (
                <ul className="space-y-2 py-2">
                  {likesUsers.map((user) => (
                    <li key={user.id} className="border rounded p-2">
                      {user.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setLikesDialogOpen(false)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Delete */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Eliminar Proyecto</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas eliminar este proyecto? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ProjectDetail;
