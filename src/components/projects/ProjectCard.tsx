// src/components/ProjectCard.tsx
import React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Bookmark, BookmarkMinus } from "lucide-react";
import { Project } from "@/types/project";

interface ProjectCardProps {
  project: Project;
  currentUser: any | null;
  loadingLike: boolean;
  loadingSave: boolean;
  onLikeToggle: (projectId: string) => void;
  onSaveToggle: (projectId: string) => void;
  onOpenComments: (projectId: string) => void;
  navigateToProject: (projectId: string) => void;
  commentsCount: number;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  currentUser,
  loadingLike,
  loadingSave,
  onLikeToggle,
  onSaveToggle,
  onOpenComments,
  navigateToProject,
  commentsCount,
}) => {
  const likedBy = project.likedBy || [];
  const hasLiked = currentUser ? likedBy.includes(currentUser.uid) : false;
  const savedBy = project.savedBy || [];
  const hasSaved = currentUser ? savedBy.includes(currentUser.uid) : false;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{project.title}</CardTitle>
        <CardDescription>
          <div className="flex items-center gap-2">
            <span>
              Por {project.authorName} • Creado el{" "}
              {project.createdAt.toLocaleDateString("es-ES", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <Badge className="bg-muted text-foreground">{project.category}</Badge>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
          {project.description}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between items-center space-x-2">
        <Button
          variant="outline"
          onClick={() => navigateToProject(project.id || "")}
          className="flex-grow"
        >
          Ver Proyecto
        </Button>

        <Button
          variant={hasLiked ? "destructive" : "ghost"}
          onClick={() => onLikeToggle(project.id || "")}
          disabled={loadingLike}
          className="flex items-center space-x-1"
          title={hasLiked ? "Quitar like" : "Dar like"}
        >
          <Heart />
          <span>{project.likes || 0}</span>
        </Button>

        <Button
          variant="ghost"
          onClick={() => onOpenComments(project.id || "")}
          className="flex items-center space-x-1"
          title="Comentarios"
        >
          <MessageCircle />
          <span>{commentsCount || 0}</span>
        </Button>

        <Button
          variant={hasSaved ? "secondary" : "ghost"}
          onClick={() => onSaveToggle(project.id || "")}
          disabled={loadingSave}
          className="flex items-center space-x-1"
          title={hasSaved ? "Quitar guardado" : "Guardar"}
        >
          {hasSaved ? <Bookmark /> : <BookmarkMinus />}
          <span>{project.saves || 0}</span>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProjectCard;
