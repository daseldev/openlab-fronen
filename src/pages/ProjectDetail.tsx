import React from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

interface ProjectDetailProps {
  isOwner?: boolean;
  onDelete?: (id: string) => void;
}

const ProjectDetail = ({
  isOwner = false,
  onDelete = () => {},
}: ProjectDetailProps) => {
  const { id } = useParams<{ id: string }>();

  // Mock project data - in a real app, this would be fetched from a database
  const project = {
    id: id || "1",
    title: "Machine Learning Image Recognition System",
    description:
      "A comprehensive system that uses convolutional neural networks to identify and classify objects in images. The project implements state-of-the-art algorithms for feature extraction and pattern recognition, achieving over 95% accuracy on standard benchmark datasets. The system includes a user-friendly interface for uploading images and viewing classification results, as well as detailed analytics on confidence scores and alternative classifications.",
    author: {
      id: "123",
      name: "Alex Johnson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    },
    createdAt: new Date().toLocaleDateString(),
  };

  const handleDelete = () => {
    onDelete(project.id);
  };

  return (
    <div className="container mx-auto py-8 px-4 bg-background">
      <div className="mb-6">
        <Link to="/">
          <Button variant="ghost" className="pl-0">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </Link>
      </div>

      <Card className="max-w-4xl mx-auto shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <CardTitle className="text-3xl font-bold">
              {project.title}
            </CardTitle>
            {isOwner && (
              <div className="flex space-x-2">
                <Link to={`/edit-project/${project.id}`}>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </Link>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete your project and remove it from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          <div className="prose max-w-none dark:prose-invert">
            <p className="text-lg text-muted-foreground mb-8">
              {project.description}
            </p>
          </div>
        </CardContent>

        <CardFooter className="border-t pt-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage
                src={project.author.avatar}
                alt={project.author.name}
              />
              <AvatarFallback>{project.author.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{project.author.name}</p>
              <p className="text-sm text-muted-foreground">
                Created on {project.createdAt}
              </p>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ProjectDetail;
