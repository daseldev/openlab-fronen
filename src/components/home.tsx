import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MoonIcon,
  SunIcon,
  SearchIcon,
  LogInIcon,
  UserPlusIcon,
  LogOutIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { LogIn, UserPlus, ArrowRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAllProjects } from "@/lib/projects";
import { Project } from "@/types/project";
import { Badge } from "@/components/ui/badge";

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string): string | null => {
  if (password.length < 6) {
    return "La contraseña debe tener al menos 6 caracteres";
  }
  if (!/[A-Z]/.test(password)) {
    return "La contraseña debe contener al menos una mayúscula";
  }
  if (!/[a-z]/.test(password)) {
    return "La contraseña debe contener al menos una minúscula";
  }
  if (!/[0-9]/.test(password)) {
    return "La contraseña debe contener al menos un número";
  }
  return null;
};

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

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const allProjects = await getAllProjects();
        const onlyVisible = allProjects.filter((p) => p.visible);
        setProjects(onlyVisible);
      } catch (error) {
        // Puedes mostrar un toast de error si lo deseas
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, []);

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
              <TabsTrigger key={cat} value={cat}>{cat}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="text-center py-12">Cargando proyectos...</div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-2">
              No se encontraron proyectos
            </h2>
            <p className="text-muted-foreground">
              Intenta con otra búsqueda o explora todas las categorías
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.slice(0, 6).map((project) => (
              <Card key={project.id} className="h-full overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle>{project.title}</CardTitle>
                  <CardDescription>
                    <div className="flex items-center gap-2">
                      <span>
                        Por {project.authorName} • {project.createdAt && project.createdAt.toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
                      </span>
                      <Badge className="bg-muted text-foreground">{project.category}</Badge>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground line-clamp-3">
                    {project.description}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  <Button variant="outline" onClick={() => window.location.href = `/projects/${project.id}`}>Ver Proyecto</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container py-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © 2023 Mi OpenLab. Todos los derechos reservados.
          </p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Button variant="ghost" size="sm">
              Acerca de
            </Button>
            <Button variant="ghost" size="sm">
              Términos
            </Button>
            <Button variant="ghost" size="sm">
              Privacidad
            </Button>
            <Button variant="ghost" size="sm">
              Contacto
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
