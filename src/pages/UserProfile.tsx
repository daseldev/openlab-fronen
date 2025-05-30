import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/components/ui/use-toast";
import { updateProfile } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const UserProfile = () => {
  const { currentUser } = useAuth();
  const [displayName, setDisplayName] = useState(currentUser?.displayName || "");
  const [bio, setBio] = useState("");
  const [photoURL, setPhotoURL] = useState(currentUser?.photoURL || "");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setBio(userData.bio || "");
            setDisplayName(currentUser.displayName || "");
            setPhotoURL(currentUser.photoURL || "");
          } else {
            // Si no existe el documento, lo creamos
            await setDoc(doc(db, "users", currentUser.uid), {
              bio: "",
              displayName: currentUser.displayName || "",
              photoURL: currentUser.photoURL || "",
              email: currentUser.email,
            });
          }
        } catch (error) {
          console.error("Error al cargar el perfil:", error);
          toast({
            title: "Error",
            description: "No se pudo cargar tu perfil.",
            variant: "destructive",
          });
        }
      }
    };

    loadUserProfile();
  }, [currentUser]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadProfileImage = async (file: File): Promise<string> => {
    const storage = getStorage();
    const storageRef = ref(storage, `profile_images/${currentUser?.uid}/${file.name}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setIsLoading(true);

    try {
      let newPhotoURL = photoURL;

      if (selectedFile) {
        newPhotoURL = await uploadProfileImage(selectedFile);
      }

      // Actualizar el perfil en Firebase Auth
      await updateProfile(currentUser, {
        displayName,
        photoURL: newPhotoURL,
      });

      // Actualizar la información adicional en Firestore
      await updateDoc(doc(db, "users", currentUser.uid), {
        bio,
        displayName,
        photoURL: newPhotoURL,
        updatedAt: new Date().toISOString(),
      });

      toast({
        title: "Perfil actualizado",
        description: "Tu perfil ha sido actualizado correctamente.",
      });

      // Limpiar el archivo seleccionado después de guardar
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error("Error al actualizar el perfil:", error);
      toast({
        title: "Error",
        description: "Hubo un error al actualizar tu perfil.",
        variant: "destructive",
      });
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

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-3xl font-bold mb-8">Mi Perfil</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Avatar className="h-32 w-32">
              <AvatarImage src={previewUrl || photoURL} />
              <AvatarFallback className="text-4xl">{getUserInitials()}</AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0">
              <Label
                htmlFor="photo-upload"
                className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 p-2 rounded-full"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </Label>
              <Input
                id="photo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Nombre</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Tu nombre"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              value={currentUser?.email || ""}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Biografía</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Cuéntanos sobre ti..."
              className="min-h-[100px]"
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </form>
    </div>
  );
};

export default UserProfile; 