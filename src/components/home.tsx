import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MoonIcon,
  SunIcon,
  SearchIcon,
  LogInIcon,
  UserPlusIcon,
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

interface Project {
  id: string;
  title: string;
  description: string;
  author: {
    name: string;
    avatar?: string;
  };
}

const Home = () => {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [searchQuery, setSearchQuery] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { currentUser, login, register, logout } = useAuth();
  const navigate = useNavigate();

  // Mock projects data
  const [projects, setProjects] = useState<Project[]>([
    {
      id: "1",
      title: "Análisis de Datos Climáticos",
      description:
        "Un proyecto que analiza patrones climáticos utilizando Python y bibliotecas de visualización de datos.",
      author: {
        name: "Ana García",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ana",
      },
    },
    {
      id: "2",
      title: "Robot Seguidor de Línea",
      description:
        "Diseño y construcción de un robot que puede seguir una línea utilizando sensores infrarrojos.",
      author: {
        name: "Carlos Rodríguez",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos",
      },
    },
    {
      id: "3",
      title: "Aplicación de Gestión de Tareas",
      description:
        "Una aplicación web para gestionar tareas y proyectos con funcionalidades colaborativas.",
      author: {
        name: "Elena Martínez",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena",
      },
    },
    {
      id: "4",
      title: "Sistema de Riego Automatizado",
      description:
        "Un sistema IoT que monitorea la humedad del suelo y riega plantas automáticamente cuando es necesario.",
      author: {
        name: "Miguel López",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Miguel",
      },
    },
    {
      id: "5",
      title: "Estudio de Biodiversidad Local",
      description:
        "Investigación sobre la biodiversidad en un ecosistema local con análisis de datos recolectados.",
      author: {
        name: "Laura Sánchez",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Laura",
      },
    },
    {
      id: "6",
      title: "Videojuego Educativo",
      description:
        "Un videojuego diseñado para enseñar conceptos de física a estudiantes de secundaria.",
      author: {
        name: "David Fernández",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
      },
    },
  ]);

  const filteredProjects = projects.filter(
    (project) =>
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
    // In a real implementation, you would update the document class or use a theme context
    document.documentElement.classList.toggle("dark");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(loginEmail, loginPassword);
      setLoginOpen(false);
      setLoginEmail("");
      setLoginPassword("");
      toast({
        title: "Inicio de sesión exitoso",
        description: "Has iniciado sesión correctamente.",
      });
      navigate("/dashboard");
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      setError("Error al iniciar sesión. Verifica tus credenciales.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (registerPassword !== registerConfirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setIsLoading(true);

    try {
      await register(registerEmail, registerPassword, registerName);
      setRegisterOpen(false);
      setRegisterEmail("");
      setRegisterPassword("");
      setRegisterName("");
      setRegisterConfirmPassword("");
      toast({
        title: "Registro exitoso",
        description: "Tu cuenta ha sido creada correctamente.",
      });
      navigate("/dashboard");
    } catch (error) {
      console.error("Error al registrarse:", error);
      setError(
        "Error al crear la cuenta. Intenta con otro correo electrónico.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente.",
      });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <div
      className={`min-h-screen bg-background ${theme === "dark" ? "dark" : ""}`}
    >
      {/* Navigation Bar */}
      <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-xl font-bold text-primary">
              Mi OpenLab
            </Link>
          </div>

          <div className="flex items-center gap-4">
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

            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === "light" ? (
                <MoonIcon className="h-5 w-5" />
              ) : (
                <SunIcon className="h-5 w-5" />
              )}
            </Button>

            {currentUser ? (
              <div className="flex items-center gap-4">
                <Link to="/dashboard">
                  <Button variant="outline">Mi Portal</Button>
                </Link>
                <Button variant="ghost" onClick={handleLogout}>
                  Cerrar Sesión
                </Button>
                <Avatar>
                  <AvatarImage
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.email}`}
                  />
                  <AvatarFallback>
                    {currentUser.displayName
                      ? currentUser.displayName[0]
                      : currentUser.email?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Dialog
                  open={loginOpen}
                  onOpenChange={(open) => {
                    setLoginOpen(open);
                    if (!open) {
                      setError("");
                      setLoginEmail("");
                      setLoginPassword("");
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      <LogInIcon className="h-4 w-4" />
                      Iniciar Sesión
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Iniciar Sesión</DialogTitle>
                      <DialogDescription>
                        Ingresa tus credenciales para acceder a tu cuenta.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleLogin} className="space-y-4 pt-4">
                      {error && (
                        <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                          {error}
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="email">Correo Electrónico</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="correo@ejemplo.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Contraseña</Label>
                        <Input
                          id="password"
                          type="password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                        />
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog
                  open={registerOpen}
                  onOpenChange={(open) => {
                    setRegisterOpen(open);
                    if (!open) {
                      setError("");
                      setRegisterEmail("");
                      setRegisterPassword("");
                      setRegisterName("");
                      setRegisterConfirmPassword("");
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-1">
                      <UserPlusIcon className="h-4 w-4" />
                      Registrarse
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Crear una cuenta</DialogTitle>
                      <DialogDescription>
                        Completa el formulario para registrarte en Mi OpenLab.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleRegister} className="space-y-4 pt-4">
                      {error && (
                        <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                          {error}
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="register-name">Nombre</Label>
                        <Input
                          id="register-name"
                          type="text"
                          value={registerName}
                          onChange={(e) => setRegisterName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-email">
                          Correo Electrónico
                        </Label>
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="correo@ejemplo.com"
                          value={registerEmail}
                          onChange={(e) => setRegisterEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-password">Contraseña</Label>
                        <Input
                          id="register-password"
                          type="password"
                          value={registerPassword}
                          onChange={(e) => setRegisterPassword(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-confirm-password">
                          Confirmar Contraseña
                        </Label>
                        <Input
                          id="register-confirm-password"
                          type="password"
                          value={registerConfirmPassword}
                          onChange={(e) =>
                            setRegisterConfirmPassword(e.target.value)
                          }
                          required
                        />
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? "Registrando..." : "Registrarse"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Explora Proyectos Innovadores
          </h1>
          <p className="text-xl text-muted-foreground">
            Descubre proyectos creativos y comparte tus propias ideas con la
            comunidad
          </p>
        </div>

        <Tabs defaultValue="all" className="mb-8">
          <TabsList className="mx-auto">
            <TabsTrigger value="all">Todos los Proyectos</TabsTrigger>
            <TabsTrigger value="tech">Tecnología</TabsTrigger>
            <TabsTrigger value="science">Ciencia</TabsTrigger>
            <TabsTrigger value="art">Arte</TabsTrigger>
          </TabsList>
        </Tabs>

        {filteredProjects.length === 0 ? (
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
            {filteredProjects.map((project) => (
              <Link to={`/project/${project.id}`} key={project.id}>
                <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle>{project.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground line-clamp-3">
                      {project.description}
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={project.author.avatar} />
                        <AvatarFallback>
                          {project.author.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">
                        {project.author.name}
                      </span>
                    </div>
                  </CardFooter>
                </Card>
              </Link>
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
