import React, { useState, useEffect } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { Moon, Sun, LogIn, LogOut, User, Menu, X } from "lucide-react";
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

interface MainLayoutProps {
  children?: React.ReactNode;
  isAuthenticated?: boolean;
  user?: {
    email: string;
    displayName?: string;
  } | null;
  onSignOut?: () => void;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { currentUser, logout } = useAuth();
  const isAuthenticated = !!currentUser;
  const user = currentUser
    ? {
        email: currentUser.email || "",
        displayName: currentUser.displayName || "",
      }
    : null;
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Check for user's preferred theme on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

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

  const getUserInitials = () => {
    if (user?.displayName) {
      return user.displayName
        .split(" ")
        .map((name) => name[0])
        .join("");
    }
    return user?.email?.charAt(0).toUpperCase() || "U";
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navigation Bar */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo and Title */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">ML</span>
            </div>
            <span className="font-bold text-xl">Mi OpenLab</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className="text-foreground hover:text-primary transition-colors"
            >
              Explorar Proyectos
            </Link>
            {isAuthenticated && (
              <Link
                to="/dashboard"
                className="text-foreground hover:text-primary transition-colors"
              >
                Mi Portal
              </Link>
            )}

            <div className="flex items-center space-x-2">
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full"
              >
                {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
              </Button>

              {/* Authentication */}
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="rounded-full p-0 h-9 w-9"
                    >
                      <Avatar>
                        <AvatarImage
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
                        />
                        <AvatarFallback>{getUserInitials()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Mi Portal
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/login">
                    <LogIn className="mr-2 h-4 w-4" />
                    Iniciar Sesión
                  </Link>
                </Button>
              )}
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="mr-2 rounded-full"
            >
              {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
            </Button>

            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu size={24} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[250px]">
                <div className="flex flex-col space-y-4 mt-8">
                  <Link
                    to="/"
                    className="text-foreground hover:text-primary transition-colors py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Explorar Proyectos
                  </Link>

                  {isAuthenticated ? (
                    <>
                      <Link
                        to="/dashboard"
                        className="text-foreground hover:text-primary transition-colors py-2"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <User className="inline mr-2 h-4 w-4" />
                        Mi Portal
                      </Link>
                      <Button variant="outline" onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Cerrar Sesión
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" asChild>
                      <Link
                        to="/login"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <LogIn className="mr-2 h-4 w-4" />
                        Iniciar Sesión
                      </Link>
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-6">
        {children || <Outlet />}
      </main>

      {/* Footer */}
      <footer className="border-t bg-card py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Mi OpenLab. Todos los derechos
            reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
