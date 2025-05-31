import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getSavedProjectsByUser } from "@/lib/projects";
import { Project } from "@/types/project";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const UserFavorites = () => {
  const { currentUser } = useAuth();
  const [favorites, setFavorites] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!currentUser) return;
      setLoading(true);
      try {
        const savedProjects = await getSavedProjectsByUser(currentUser.uid);
        setFavorites(savedProjects);
      } catch (error) {
        console.error("Error al cargar favoritos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
  }, [currentUser]);

  if (!currentUser) {
    return <p>Debes iniciar sesión para ver tus favoritos.</p>;
  }

  if (loading) {
    return <p>Cargando favoritos...</p>;
  }

  if (favorites.length === 0) {
    return <p>No tienes proyectos guardados.</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
            Proyectos guardados
          </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {favorites.map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <CardTitle>{project.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="line-clamp-3">{project.description}</p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => navigate(`/projects/${project.id}`)} variant="outline" className="w-full">
                Ver Proyecto
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UserFavorites;
