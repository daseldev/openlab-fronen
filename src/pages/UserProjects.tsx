import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Project } from "@/types/project";
import { getAllProjects } from "@/lib/projects";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const UserProjects = () => {
  const { userId } = useParams<{ userId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [userName, setUserName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const isMyProjects = location.pathname === "/my-projects";

  useEffect(() => {
    const fetchData = async () => {
      try {
        let targetUserId = userId;
        let showAllProjects = false;

        if (isMyProjects) {
          targetUserId = currentUser?.uid;
          showAllProjects = true;
        }

        if (!targetUserId) return;

        // Obtener información del usuario
        const userDoc = await getDoc(doc(db, "users", targetUserId));
        if (userDoc.exists()) {
          setUserName(userDoc.data().displayName || "Usuario");
        }

        // Obtener proyectos
        const allProjects = await getAllProjects();
        const userProjects = allProjects.filter(
          (project) => 
            project.authorId === targetUserId && 
            (showAllProjects || project.visible)
        );
        setProjects(userProjects);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId, currentUser, isMyProjects]);

  if (isLoading) {
    return <div className="text-center py-10">Cargando proyectos...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">
          {isMyProjects ? "Mis Proyectos" : `Proyectos de ${userName}`}
        </h1>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-2">
            No hay proyectos disponibles
          </h2>
          <p className="text-muted-foreground">
            {isMyProjects 
              ? "Aún no has creado ningún proyecto."
              : "Este usuario aún no ha compartido ningún proyecto público."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="h-full overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle>{project.title}</CardTitle>
                <CardDescription>
                  <div className="flex items-center gap-2">
                    <span>
                      Creado el{" "}
                      {project.createdAt.toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                    <Badge className="bg-muted text-foreground">{project.category}</Badge>
                    {!project.visible && isMyProjects && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        Privado
                      </Badge>
                    )}
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground line-clamp-3">
                  {project.description}
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  Ver Proyecto
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserProjects; 