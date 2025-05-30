import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Project } from "@/types/project";
import { getUserProjects, deleteProject, createProject, updateProject } from "@/lib/projects";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Plus, Edit, Trash2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = [
  { value: "Datos", label: "Datos" },
  { value: "Desarrollo Web", label: "Desarrollo Web" },
  { value: "Desarrollo Móvil", label: "Desarrollo Móvil" },
  { value: "Inteligencia Artificial", label: "Inteligencia Artificial" },
  { value: "Redes", label: "Redes" },
  { value: "Seguridad", label: "Seguridad" },
  { value: "IoT", label: "IoT" },
  { value: "Cloud", label: "Cloud" },
  { value: "Videojuegos", label: "Videojuegos" },
  { value: "Robótica", label: "Robótica" },
  { value: "Otro", label: "Otro" },
];

const UserDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Datos",
  });
  const [formErrors, setFormErrors] = useState<any>({});

  useEffect(() => {
    if (currentUser) {
      loadProjects();
    }
  }, [location.pathname, currentUser]);

  const loadProjects = async () => {
    if (!currentUser) return;
    try {
      const userProjects = await getUserProjects(currentUser.uid);
      setProjects(userProjects);
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

  const validateProject = (data: any) => {
    const errors: any = {};
    if (!data.title || data.title.trim().length < 4) errors.title = "El título es obligatorio (mínimo 4 caracteres).";
    if (!data.description || data.description.trim().length < 10) errors.description = "La descripción es obligatoria (mínimo 10 caracteres).";
    if (!data.category) errors.category = "La categoría es obligatoria.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!validateProject(formData)) return;

    try {
      const newProject = await createProject(
        formData,
        currentUser.uid,
        currentUser.displayName || currentUser.email || "Usuario"
      );
      setProjects([newProject, ...projects]);
      setCreateDialogOpen(false);
      setFormData({ title: "", description: "", category: "Datos" });
      toast({
        title: "Proyecto creado",
        description: "Tu proyecto ha sido creado exitosamente.",
      });
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el proyecto.",
        variant: "destructive",
      });
    }
  };

  const handleEditProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    if (!validateProject(formData)) return;

    try {
      await updateProject(selectedProject.id, formData);
      setProjects(
        projects.map((p) =>
          p.id === selectedProject.id
            ? { ...p, ...formData, updatedAt: new Date() }
            : p
        )
      );
      setEditDialogOpen(false);
      setSelectedProject(null);
      setFormData({ title: "", description: "", category: "Datos" });
      toast({
        title: "Proyecto actualizado",
        description: "Tu proyecto ha sido actualizado exitosamente.",
      });
    } catch (error) {
      console.error("Error updating project:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el proyecto.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;

    try {
      await deleteProject(selectedProject.id);
      setProjects(projects.filter((p) => p.id !== selectedProject.id));
      setDeleteDialogOpen(false);
      setSelectedProject(null);
      toast({
        title: "Proyecto eliminado",
        description: "Tu proyecto ha sido eliminado exitosamente.",
      });
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el proyecto.",
        variant: "destructive",
      });
    }
  };

  // Validar en tiempo real
  useEffect(() => {
    validateProject(formData);
    // eslint-disable-next-line
  }, [formData]);

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  // Debug logs
  console.log("UID actual:", currentUser?.uid);
  console.log("Proyectos traídos:", projects);

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Mis Proyectos</h1>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Proyecto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Proyecto</DialogTitle>
              <DialogDescription>
                Completa los detalles de tu nuevo proyecto.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateProject}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value });
                      setFormErrors({ ...formErrors, title: undefined });
                    }}
                    required
                  />
                  {formErrors.title && <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => {
                      setFormData({ ...formData, description: e.target.value });
                      setFormErrors({ ...formErrors, description: undefined });
                    }}
                    required
                  />
                  {formErrors.description && <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoría</Label>
                  <select
                    id="category"
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                    value={formData.category}
                    onChange={e => {
                      setFormData({ ...formData, category: e.target.value });
                      setFormErrors({ ...formErrors, category: undefined });
                    }}
                    required
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                  {formErrors.category && <p className="text-red-500 text-sm mt-1">{formErrors.category}</p>}
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={Object.keys(formErrors).length > 0}>Crear Proyecto</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">
            No tienes proyectos creados. ¡Crea tu primer proyecto!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <CardTitle>{project.title}</CardTitle>
                <CardDescription>
                  <div className="flex items-center gap-2">
                    <span>
                      Creado el {project.createdAt.toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
                    </span>
                    <Badge className="bg-muted text-foreground">
                      {project.category}
                    </Badge>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {project.description}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Ver
                </Button>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setSelectedProject(project);
                      setFormData({
                        title: project.title,
                        description: project.description,
                        category: project.category,
                      });
                      setEditDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setSelectedProject(project);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Proyecto</DialogTitle>
            <DialogDescription>
              Modifica los detalles de tu proyecto.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditProject}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Título</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    setFormErrors({ ...formErrors, title: undefined });
                  }}
                  required
                />
                {formErrors.title && <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Descripción</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value });
                    setFormErrors({ ...formErrors, description: undefined });
                  }}
                  required
                />
                {formErrors.description && <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Categoría</Label>
                <select
                  id="edit-category"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  value={formData.category}
                  onChange={e => {
                    setFormData({ ...formData, category: e.target.value });
                    setFormErrors({ ...formErrors, category: undefined });
                  }}
                  required
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
                {formErrors.category && <p className="text-red-500 text-sm mt-1">{formErrors.category}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={Object.keys(formErrors).length > 0}>Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Proyecto</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este proyecto? Esta acción no se
              puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteProject}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserDashboard;
