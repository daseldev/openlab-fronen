import React, { useEffect, useState } from "react";
import { getAllGroups, joinGroup, leaveGroup, createGroup } from "@/lib/groups";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

const Groups = () => {
  const { currentUser } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGroups = async () => {
      setIsLoading(true);
      const all = await getAllGroups();
      setGroups(all);
      setIsLoading(false);
    };
    fetchGroups();
  }, []);

  const handleJoin = async (groupId: string, isMember: boolean) => {
    if (!currentUser) return;
    setJoining(groupId);
    if (isMember) {
      await leaveGroup(groupId, currentUser.uid);
    } else {
      await joinGroup(groupId, currentUser.uid);
    }
    // Refrescar grupos
    const all = await getAllGroups();
    setGroups(all);
    setJoining(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!newName.trim() || !newDesc.trim()) {
      toast({ title: "Error", description: "Completa todos los campos.", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const groupId = newName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
      await createGroup(groupId, newName.trim(), newDesc.trim(), currentUser.uid);
      setCreateOpen(false);
      setNewName("");
      setNewDesc("");
      toast({ title: "Grupo creado", description: "El grupo se ha creado correctamente." });
      const all = await getAllGroups();
      setGroups(all);
    } catch (e) {
      toast({ title: "Error", description: "No se pudo crear el grupo.", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Grupos de Interés</h1>
        {currentUser && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>Crear grupo</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear nuevo grupo</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <Input
                  placeholder="Nombre del grupo (ej: React, IA, Diseño)"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  maxLength={30}
                  required
                />
                <Textarea
                  placeholder="Descripción del grupo"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  maxLength={200}
                  required
                />
                <DialogFooter>
                  <Button type="submit" disabled={creating}>{creating ? "Creando..." : "Crear grupo"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      {isLoading ? (
        <div className="text-center py-10">Cargando...</div>
      ) : groups.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">No hay grupos disponibles.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => {
            const isMember = currentUser && group.members?.includes(currentUser.uid);
            return (
              <Card key={group.id}>
                <CardHeader>
                  <CardTitle>{group.name}</CardTitle>
                  <CardDescription>{group.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground mb-2">
                    {group.members?.length || 0} miembros
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button variant="outline" onClick={() => navigate(`/groups/${group.id}`)}>
                    Ver grupo
                  </Button>
                  {currentUser && (
                    <Button
                      onClick={() => handleJoin(group.id, isMember)}
                      disabled={joining === group.id}
                      variant={isMember ? "secondary" : "default"}
                    >
                      {isMember ? "Salir" : "Unirse"}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Groups; 