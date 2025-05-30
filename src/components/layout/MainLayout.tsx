import React, { useState, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { Moon, Sun, LogIn, LogOut, User, Menu, X, LogInIcon, UserPlusIcon, UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
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
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";

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

const MainLayout = () => {
  const { currentUser, login, register, logout, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginErrors, setLoginErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [registerErrors, setRegisterErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else if (prefersDark) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const handleSignOut = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErrors({});
    setError("");
    if (!validateEmail(loginEmail)) {
      setLoginErrors(prev => ({ ...prev, email: "Email inválido" }));
      return;
    }
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
    setRegisterErrors({});
    setError("");
    if (registerName.length < 2) {
      setRegisterErrors(prev => ({ ...prev, name: "El nombre debe tener al menos 2 caracteres" }));
      return;
    }
    if (!validateEmail(registerEmail)) {
      setRegisterErrors(prev => ({ ...prev, email: "Email inválido" }));
      return;
    }
    const passwordError = validatePassword(registerPassword);
    if (passwordError) {
      setRegisterErrors(prev => ({ ...prev, password: passwordError }));
      return;
    }
    if (registerPassword !== registerConfirmPassword) {
      setRegisterErrors(prev => ({ ...prev, confirmPassword: "Las contraseñas no coinciden" }));
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
      setError("Error al crear la cuenta. Intenta con otro correo electrónico.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    setResetSuccess(false);
    
    if (!validateEmail(resetEmail)) {
      setResetError("Por favor, ingresa un correo electrónico válido");
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(resetEmail);
      setResetSuccess(true);
      setResetEmail("");
      toast({
        title: "Correo enviado",
        description: "Se ha enviado un correo con instrucciones para restablecer tu contraseña.",
      });
    } catch (error) {
      console.error("Error al enviar correo de recuperación:", error);
      setResetError("Error al enviar el correo de recuperación. Verifica el correo electrónico.");
    } finally {
      setIsLoading(false);
    }
  };

  const getUserInitials = () => {
    if (currentUser?.displayName) {
      return currentUser.displayName
        .split(" ")
        .map((name) => name[0])
        .join("");
    }
    return currentUser?.email?.charAt(0).toUpperCase() || "U";
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: "/", label: "Inicio" },
    { path: "/explore", label: "Explorar" },
    ...(currentUser ? [
      { path: "/feed", label: "Feed" },
      { path: "/dashboard", label: "Mis Proyectos" },
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 hidden md:flex">
            <Link to="/" className="mr-6 flex items-center space-x-2">
              <span className="hidden font-bold sm:inline-block">
                Mi OpenLab
              </span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`transition-colors hover:text-foreground/80 ${
                    isActive(item.path)
                      ? "text-foreground"
                      : "text-foreground/60"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0">
              <Link
                to="/"
                className="flex items-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="font-bold">Mi OpenLab</span>
              </Link>
              <nav className="flex flex-col space-y-4 mt-4">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`text-sm font-medium transition-colors hover:text-foreground/80 ${
                      isActive(item.path)
                        ? "text-foreground"
                        : "text-foreground/60"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          <div className="flex flex-1 items-center justify-end space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9"
            >
              {theme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
            {currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => currentUser && navigate(`/profile/${currentUser.uid}`)}
                  >
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Mi Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" onClick={() => setLoginOpen(true)}>
                      <LogInIcon className="h-4 w-4 mr-1" />Iniciar Sesión
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
                          onChange={(e) => {
                            setLoginEmail(e.target.value);
                            setLoginErrors(prev => ({ ...prev, email: undefined }));
                          }}
                          className={loginErrors.email ? "border-destructive" : ""}
                          required
                        />
                        {loginErrors.email && (
                          <p className="text-sm text-destructive">{loginErrors.email}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Contraseña</Label>
                        <Input
                          id="password"
                          type="password"
                          value={loginPassword}
                          onChange={(e) => {
                            setLoginPassword(e.target.value);
                            setLoginErrors(prev => ({ ...prev, password: undefined }));
                          }}
                          className={loginErrors.password ? "border-destructive" : ""}
                          required
                        />
                        {loginErrors.password && (
                          <p className="text-sm text-destructive">{loginErrors.password}</p>
                        )}
                        <Button
                          variant="link"
                          className="px-0 text-sm"
                          onClick={() => {
                            setLoginOpen(false);
                            setResetPasswordOpen(true);
                          }}
                        >
                          ¿Olvidaste tu contraseña?
                        </Button>
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
                <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" onClick={() => setRegisterOpen(true)}>
                      <UserPlusIcon className="h-4 w-4 mr-1" />Registrarse
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
                          onChange={(e) => {
                            setRegisterName(e.target.value);
                            setRegisterErrors(prev => ({ ...prev, name: undefined }));
                          }}
                          className={registerErrors.name ? "border-destructive" : ""}
                          required
                        />
                        {registerErrors.name && (
                          <p className="text-sm text-destructive">{registerErrors.name}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-email">Correo Electrónico</Label>
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="correo@ejemplo.com"
                          value={registerEmail}
                          onChange={(e) => {
                            setRegisterEmail(e.target.value);
                            setRegisterErrors(prev => ({ ...prev, email: undefined }));
                          }}
                          className={registerErrors.email ? "border-destructive" : ""}
                          required
                        />
                        {registerErrors.email && (
                          <p className="text-sm text-destructive">{registerErrors.email}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-password">Contraseña</Label>
                        <Input
                          id="register-password"
                          type="password"
                          value={registerPassword}
                          onChange={(e) => {
                            setRegisterPassword(e.target.value);
                            setRegisterErrors(prev => ({ ...prev, password: undefined }));
                          }}
                          className={registerErrors.password ? "border-destructive" : ""}
                          required
                        />
                        {registerErrors.password && (
                          <p className="text-sm text-destructive">{registerErrors.password}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-confirm-password">Confirmar Contraseña</Label>
                        <Input
                          id="register-confirm-password"
                          type="password"
                          value={registerConfirmPassword}
                          onChange={(e) => {
                            setRegisterConfirmPassword(e.target.value);
                            setRegisterErrors(prev => ({ ...prev, confirmPassword: undefined }));
                          }}
                          className={registerErrors.confirmPassword ? "border-destructive" : ""}
                          required
                        />
                        {registerErrors.confirmPassword && (
                          <p className="text-sm text-destructive">{registerErrors.confirmPassword}</p>
                        )}
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? "Registrando..." : "Registrarse"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
                <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Recuperar Contraseña</DialogTitle>
                      <DialogDescription>
                        Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleResetPassword} className="space-y-4 pt-4">
                      {resetError && (
                        <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                          {resetError}
                        </div>
                      )}
                      {resetSuccess && (
                        <div className="bg-green-500/15 text-green-500 text-sm p-3 rounded-md">
                          Se ha enviado un correo con instrucciones para restablecer tu contraseña.
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="reset-email">Correo Electrónico</Label>
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="correo@ejemplo.com"
                          value={resetEmail}
                          onChange={(e) => {
                            setResetEmail(e.target.value);
                            setResetError("");
                          }}
                          required
                        />
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? "Enviando..." : "Enviar instrucciones"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
