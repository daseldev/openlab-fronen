import React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { Link } from "react-router-dom";

interface ProjectCardProps {
  id?: string;
  title?: string;
  description?: string;
  author?: {
    name?: string;
    avatar?: string;
    authorId?: string;
  };
  isOwner?: boolean;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const ProjectCard = ({
  id = "project-1",
  title = "Project Title",
  description = "This is a brief description of the project. It gives an overview of what the project is about.",
  author = {
    name: "John Doe",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
  },
  isOwner = false,
  onView = () => {},
  onEdit = () => {},
  onDelete = () => {},
}: ProjectCardProps) => {
  return (
    <Card className="w-full max-w-sm h-full bg-card overflow-hidden flex flex-col transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold line-clamp-1">
            {title}
          </CardTitle>
          {isOwner && (
            <Badge variant="secondary" className="ml-2">
              Your Project
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
          {description}
        </p>
      </CardContent>

      <CardFooter className="pt-2 flex justify-between items-center border-t">
        <div className="flex items-center space-x-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={author.avatar} alt={author.name} />
            <AvatarFallback>{author.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          {author.authorId && author.name ? (
            <Link to={`/profile/${author.authorId}`} className="text-xs text-blue-600 hover:underline">
              {author.name}
            </Link>
          ) : (
            <span className="text-xs text-muted-foreground">{author.name}</span>
          )}
        </div>

        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(id)}
            className="flex items-center"
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>

          {isOwner && (
            <>
              <Button variant="outline" size="sm" onClick={() => onEdit(id)}>
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(id)}
              >
                Delete
              </Button>
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProjectCard;
