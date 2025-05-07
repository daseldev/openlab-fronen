import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";

interface Project {
  id: string;
  title: string;
  description: string;
  createdAt: string;
}

const UserDashboard = () => {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: "1",
      title: "Mi primer proyecto",
      description:
        "Este es un proyecto de ejemplo para mostrar la funcionalidad de la aplicación.",
      createdAt: new Date().toISOString(),
    },
    {
      id: "2",
      title: "Investigación sobre energías renovables",
      description:
        "Proyecto de investigación sobre diferentes fuentes de energía renovable y su implementación.",
      createdAt: new Date().toISOString(),
    },
    {
      id: "3",
      title: "Aplicación web para gestión de tareas",
      description:
        "Desarrollo de una aplicación web para la gestión eficiente de tareas personales y de equipo.",
      createdAt: new Date().toISOString(),
    },
  ]);

  const [newProject, setNewProject] = useState({ title: "", description: "" });
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleCreateProject = () => {
    if (newProject.title.trim() && newProject.description.trim()) {
      const project = {
        id: Date.now().toString(),
        title: newProject.title,
        description: newProject.description,
        createdAt: new Date().toISOString(),
      };
      setProjects([...projects, project]);
      setNewProject({ title: "", description: "" });
      setIsCreateDialogOpen(false);
    }
  };

  const handleEditProject = () => {
    if (
      editingProject &&
      editingProject.title.trim() &&
      editingProject.description.trim()
    ) {
      setProjects(
        projects.map((project) =>
          project.id === editingProject.id ? editingProject : project,
        ),
      );
      setEditingProject(null);
      setIsEditDialogOpen(false);
    }
  };

  const handleDeleteProject = () => {
    if (projectToDelete) {
      setProjects(projects.filter((project) => project.id !== projectToDelete));
      setProjectToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div className="container mx-auto py-8 bg-background min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Mi Portal de Proyectos</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <PlusCircle size={18} />
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
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={newProject.title}
                  onChange={(e) =>
                    setNewProject({ ...newProject, title: e.target.value })
                  }
                  placeholder="Título del proyecto"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={newProject.description}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe tu proyecto"
                  rows={5}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreateProject}>Crear Proyecto</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <Card className="text-center p-8">
          <CardContent>
            <p className="text-muted-foreground py-8">
              No tienes proyectos creados. ¡Crea tu primer proyecto!
            </p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="flex items-center gap-2 mx-auto"
            >
              <PlusCircle size={18} />
              Crear Proyecto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="overflow-hidden">
              <CardHeader>
                <CardTitle>{project.title}</CardTitle>
                <CardDescription>
                  Creado el {new Date(project.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3">{project.description}</p>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 pt-2">
                <Dialog
                  open={isEditDialogOpen && editingProject?.id === project.id}
                  onOpenChange={(open) => {
                    setIsEditDialogOpen(open);
                    if (!open) setEditingProject(null);
                  }}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setEditingProject(project);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Pencil size={16} />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Editar Proyecto</DialogTitle>
                      <DialogDescription>
                        Modifica los detalles de tu proyecto.
                      </DialogDescription>
                    </DialogHeader>
                    {editingProject && (
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="edit-title">Título</Label>
                          <Input
                            id="edit-title"
                            value={editingProject.title}
                            onChange={(e) =>
                              setEditingProject({
                                ...editingProject,
                                title: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="edit-description">Descripción</Label>
                          <Textarea
                            id="edit-description"
                            value={editingProject.description}
                            onChange={(e) =>
                              setEditingProject({
                                ...editingProject,
                                description: e.target.value,
                              })
                            }
                            rows={5}
                          />
                        </div>
                      </div>
                    )}
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button onClick={handleEditProject}>
                        Guardar Cambios
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <AlertDialog
                  open={isDeleteDialogOpen && projectToDelete === project.id}
                  onOpenChange={(open) => {
                    setIsDeleteDialogOpen(open);
                    if (!open) setProjectToDelete(null);
                  }}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => {
                        setProjectToDelete(project.id);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. El proyecto será
                        eliminado permanentemente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteProject}
                        className="bg-destructive text-destructive-foreground"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
