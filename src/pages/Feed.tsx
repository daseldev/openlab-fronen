import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAllProjects } from "@/lib/projects";
import { Project } from "@/types/project";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const Feed = () => {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [following, setFollowing] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeed = async () => {
      if (!currentUser) return;
      setIsLoading(true);
      try {
        // Obtener a quién sigo
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        const followingArr = userData.following || [];
        setFollowing(followingArr);
        if (followingArr.length === 0) {
          setProjects([]);
          return;
        }
        // Obtener proyectos de los usuarios que sigo
        const allProjects = await getAllProjects();
        const feedProjects = allProjects.filter(
          (p) => p.visible && followingArr.includes(p.authorId)
        );
        setProjects(feedProjects);
      } catch (e) {
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFeed();
  }, [currentUser]);

  if (!currentUser) {
    return <div className="text-center py-10">Inicia sesión para ver tu feed.</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Feed Personalizado</h1>
      {isLoading ? (
        <div className="text-center py-10">Cargando...</div>
      ) : following.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          No sigues a nadie todavía. Sigue a otros usuarios para ver sus proyectos aquí.
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          Los usuarios que sigues aún no han publicado proyectos visibles.
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
                      Por {project.authorName} • {project.createdAt && project.createdAt.toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
                    </span>
                    <Badge className="bg-muted text-foreground">{project.category}</Badge>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground line-clamp-3">{project.description}</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => navigate(`/projects/${project.id}`)}>
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

export default Feed; 