import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getGroupById, joinGroup, leaveGroup, getGroupDiscussions, createGroupDiscussion, associateProjectToGroup, removeProjectFromGroup, getDiscussionComments, createDiscussionComment } from "@/lib/groups";
import { getAllProjects } from "@/lib/projects";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

const GroupDetail = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { currentUser } = useAuth();
  const [group, setGroup] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [joining, setJoining] = useState(false);
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [discussionOpen, setDiscussionOpen] = useState(false);
  const [discussionTitle, setDiscussionTitle] = useState("");
  const [discussionContent, setDiscussionContent] = useState("");
  const [creatingDiscussion, setCreatingDiscussion] = useState(false);
  const [associateOpen, setAssociateOpen] = useState(false);
  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [associating, setAssociating] = useState(false);
  const [viewDiscussion, setViewDiscussion] = useState<any | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentContent, setCommentContent] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    const fetchGroup = async () => {
      setIsLoading(true);
      const g: any = await getGroupById(groupId!);
      setGroup(g);
      // Cargar miembros
      if (g && g.members) {
        const users = [];
        for (const uid of g.members) {
          const userDoc = await getDoc(doc(db, "users", uid));
          if (userDoc.exists()) {
            users.push({ uid, ...userDoc.data() });
          }
        }
        setMembers(users);
      }
      // Cargar proyectos asociados
      const allProjects = await getAllProjects();
      setProjects(allProjects.filter(p => g?.associatedProjects?.includes(p.id)));
      // Cargar discusiones
      const disc = await getGroupDiscussions(groupId!);
      setDiscussions(disc.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
      // Cargar proyectos propios para asociar
      if (currentUser) {
        setMyProjects(allProjects.filter(p => p.authorId === currentUser.uid && !g?.associatedProjects?.includes(p.id)));
      }
      setIsLoading(false);
    };
    fetchGroup();
  }, [groupId, currentUser]);

  const isMember = currentUser && (group as any)?.members?.includes(currentUser.uid);

  const handleJoin = async () => {
    if (!currentUser) return;
    setJoining(true);
    if (isMember) {
      await leaveGroup(groupId!, currentUser.uid);
    } else {
      await joinGroup(groupId!, currentUser.uid);
    }
    // Refrescar grupo
    const g = await getGroupById(groupId!);
    setGroup(g);
    setJoining(false);
  };

  const handleCreateDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!discussionTitle.trim() || !discussionContent.trim()) {
      toast({ title: "Error", description: "Completa todos los campos.", variant: "destructive" });
      return;
    }
    setCreatingDiscussion(true);
    try {
      await createGroupDiscussion(groupId!, discussionTitle, discussionContent, currentUser.uid, currentUser.displayName || currentUser.email);
      setDiscussionOpen(false);
      setDiscussionTitle("");
      setDiscussionContent("");
      toast({ title: "Discusión creada" });
      const disc = await getGroupDiscussions(groupId!);
      setDiscussions(disc.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
    } catch (e) {
      toast({ title: "Error", description: "No se pudo crear la discusión.", variant: "destructive" });
    } finally {
      setCreatingDiscussion(false);
    }
  };

  const handleAssociateProject = async (projectId: string) => {
    if (!currentUser) return;
    setAssociating(true);
    try {
      await associateProjectToGroup(groupId!, projectId);
      toast({ title: "Proyecto asociado" });
      setAssociateOpen(false);
      // Refrescar proyectos
      const g: any = await getGroupById(groupId!);
      setGroup(g);
      const allProjects = await getAllProjects();
      setProjects(allProjects.filter(p => g?.associatedProjects?.includes(p.id)));
      setMyProjects(allProjects.filter(p => p.authorId === currentUser.uid && !g?.associatedProjects?.includes(p.id)));
    } catch (e) {
      toast({ title: "Error", description: "No se pudo asociar el proyecto.", variant: "destructive" });
    } finally {
      setAssociating(false);
    }
  };

  const handleRemoveProject = async (projectId: string) => {
    if (!currentUser) return;
    setAssociating(true);
    try {
      await removeProjectFromGroup(groupId!, projectId);
      toast({ title: "Proyecto desasociado" });
      // Refrescar proyectos
      const g: any = await getGroupById(groupId!);
      setGroup(g);
      const allProjects = await getAllProjects();
      setProjects(allProjects.filter(p => g?.associatedProjects?.includes(p.id)));
      setMyProjects(allProjects.filter(p => p.authorId === currentUser.uid && !g?.associatedProjects?.includes(p.id)));
    } catch (e) {
      toast({ title: "Error", description: "No se pudo desasociar el proyecto.", variant: "destructive" });
    } finally {
      setAssociating(false);
    }
  };

  const openDiscussion = async (discussion: any) => {
    setViewDiscussion(discussion);
    const comm = await getDiscussionComments(groupId!, discussion.id);
    setComments(comm.sort((a, b) => a.createdAt?.seconds - b.createdAt?.seconds));
  };
  const closeDiscussion = () => {
    setViewDiscussion(null);
    setComments([]);
    setCommentContent("");
  };
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !viewDiscussion) return;
    if (!commentContent.trim()) return;
    setCommentLoading(true);
    try {
      await createDiscussionComment(groupId!, viewDiscussion.id, commentContent, currentUser.uid, currentUser.displayName || currentUser.email);
      setCommentContent("");
      const comm = await getDiscussionComments(groupId!, viewDiscussion.id);
      setComments(comm.sort((a, b) => a.createdAt?.seconds - b.createdAt?.seconds));
    } finally {
      setCommentLoading(false);
    }
  };

  if (isLoading || !group) {
    return <div className="text-center py-10">Cargando grupo...</div>;
  }

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-2">{(group as any).name}</h1>
      <p className="mb-4 text-muted-foreground">{(group as any).description}</p>
      <div className="flex gap-4 mb-6">
        <Button onClick={handleJoin} disabled={joining} variant={isMember ? "secondary" : "default"}>
          {isMember ? "Salir del grupo" : "Unirse al grupo"}
        </Button>
        <span className="text-sm text-muted-foreground">{(group as any).members?.length || 0} miembros</span>
      </div>
      <h2 className="text-xl font-semibold mb-2">Miembros</h2>
      <div className="flex flex-wrap gap-4 mb-8">
        {members.length === 0 ? (
          <span className="text-muted-foreground">Sin miembros.</span>
        ) : (
          members.map((user) => (
            <div key={user.uid} className="flex items-center gap-2 bg-muted rounded px-3 py-1">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.photoURL} />
                <AvatarFallback>{user.displayName?.[0] || "U"}</AvatarFallback>
              </Avatar>
              <span>{user.displayName || user.email}</span>
            </div>
          ))
        )}
      </div>
      {/* DISCUSIONES */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">Discusiones</h2>
          {isMember && (
            <Dialog open={discussionOpen} onOpenChange={setDiscussionOpen}>
              <DialogTrigger asChild>
                <Button>Crear discusión</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nueva discusión</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateDiscussion} className="space-y-4">
                  <Input
                    placeholder="Título de la discusión"
                    value={discussionTitle}
                    onChange={e => setDiscussionTitle(e.target.value)}
                    maxLength={60}
                    required
                  />
                  <Textarea
                    placeholder="Contenido"
                    value={discussionContent}
                    onChange={e => setDiscussionContent(e.target.value)}
                    maxLength={500}
                    required
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={creatingDiscussion}>{creatingDiscussion ? "Creando..." : "Crear"}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
        {discussions.length === 0 ? (
          <div className="text-muted-foreground mb-4">No hay discusiones en este grupo.</div>
        ) : (
          <div className="space-y-4">
            {discussions.map((d) => (
              <Card key={d.id}>
                <CardHeader>
                  <CardTitle>{d.title}</CardTitle>
                  <CardDescription>
                    Por {d.authorName} • {d.createdAt && new Date((d as any).createdAt.seconds * 1000).toLocaleString("es-ES")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>{d.content}</p>
                  <Button size="sm" className="mt-4" onClick={() => openDiscussion(d)}>Ver discusión</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {/* MODAL DE DISCUSIÓN */}
        <Dialog open={!!viewDiscussion} onOpenChange={closeDiscussion}>
          <DialogContent className="max-w-2xl">
            {viewDiscussion && (
              <>
                <DialogHeader>
                  <DialogTitle>{viewDiscussion.title}</DialogTitle>
                  <div className="text-muted-foreground text-sm mb-2">
                    Por {viewDiscussion.authorName} • {viewDiscussion.createdAt && new Date((viewDiscussion as any).createdAt.seconds * 1000).toLocaleString("es-ES")}
                  </div>
                </DialogHeader>
                <div className="mb-4">
                  <p>{viewDiscussion.content}</p>
                </div>
                <h3 className="font-semibold mb-2">Comentarios</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                  {comments.length === 0 ? (
                    <div className="text-muted-foreground">Aún no hay comentarios.</div>
                  ) : (
                    comments.map((c) => (
                      <div key={c.id} className="bg-muted rounded p-2">
                        <div className="text-sm font-medium">{c.authorName} <span className="text-xs text-muted-foreground">{c.createdAt && new Date((c as any).createdAt.seconds * 1000).toLocaleString("es-ES")}</span></div>
                        <div>{c.content}</div>
                      </div>
                    ))
                  )}
                </div>
                {isMember && (
                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <Input
                      placeholder="Escribe un comentario..."
                      value={commentContent}
                      onChange={e => setCommentContent(e.target.value)}
                      maxLength={300}
                      required
                    />
                    <Button type="submit" disabled={commentLoading || !commentContent.trim()}>{commentLoading ? "Enviando..." : "Comentar"}</Button>
                  </form>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
      {/* PROYECTOS ASOCIADOS */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">Proyectos asociados</h2>
          {isMember && (
            <Dialog open={associateOpen} onOpenChange={setAssociateOpen}>
              <DialogTrigger asChild>
                <Button>Asociar proyecto</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Asociar uno de tus proyectos</DialogTitle>
                </DialogHeader>
                {myProjects.length === 0 ? (
                  <div className="text-muted-foreground">No tienes proyectos para asociar.</div>
                ) : (
                  <div className="space-y-2">
                    {myProjects.map((p) => (
                      <Card key={p.id}>
                        <CardHeader>
                          <CardTitle>{p.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Button onClick={() => handleAssociateProject(p.id)} disabled={associating}>
                            Asociar
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          )}
        </div>
        {projects.length === 0 ? (
          <div className="text-muted-foreground mb-8">No hay proyectos asociados a este grupo.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {projects.map((project) => (
              <Card key={project.id}>
                <CardHeader>
                  <CardTitle>{project.title}</CardTitle>
                  <CardDescription>
                    <div className="flex items-center gap-2">
                      <span>
                        Por {project.authorName} • {project.createdAt && project.createdAt.toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
                      </span>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground line-clamp-3">{project.description}</p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={() => window.location.href = `/projects/${project.id}`}>Ver Proyecto</Button>
                  {(currentUser && (project.authorId === currentUser.uid || currentUser.uid === (group as any).createdBy)) && (
                    <Button variant="destructive" className="ml-2" onClick={() => handleRemoveProject(project.id)} disabled={associating}>
                      Desasociar
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupDetail; 