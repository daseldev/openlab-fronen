import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Linkedin } from "lucide-react";

const ViewProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          setProfile(userDoc.data());
        }
      } catch (error) {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  const getUserInitials = () => {
    if (profile?.displayName) {
      return profile.displayName
        .split(" ")
        .map((name: string) => name[0])
        .join("");
    }
    return profile?.email?.charAt(0).toUpperCase() || "U";
  };

  if (loading) {
    return <div className="text-center py-10">Cargando perfil...</div>;
  }
  if (!profile) {
    return <div className="text-center py-10">Perfil no encontrado.</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header tipo LinkedIn */}
      <div className="relative w-full h-48 bg-gradient-to-r from-blue-900 to-blue-600">
        {/* Avatar superpuesto */}
        <div className="absolute left-1/2 -bottom-16 transform -translate-x-1/2">
          <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
            <AvatarImage src={profile.photoURL} />
            <AvatarFallback className="text-4xl">{getUserInitials()}</AvatarFallback>
          </Avatar>
        </div>
      </div>
      <div className="pt-20 pb-8 max-w-2xl mx-auto">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-3xl font-bold">{profile.displayName || "Sin nombre"}</h1>
          {profile.headline && (
            <div className="text-lg text-muted-foreground mt-1">{profile.headline}</div>
          )}
          {profile.location && (
            <div className="text-sm text-muted-foreground mt-1">{profile.location}</div>
          )}
          {profile.linkedin && (
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-blue-700 text-white rounded-full hover:bg-blue-800 transition"
            >
              <Linkedin className="h-5 w-5" />
              Ver en LinkedIn
            </a>
          )}
          {currentUser?.uid === userId && (
            <Button className="mt-4" onClick={() => navigate("/profile/edit")}>Editar perfil</Button>
          )}
        </div>
        {/* Info lateral tipo LinkedIn */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="space-y-2">
            {profile.contactInfo && (
              <div>
                <span className="font-semibold">Contacto:</span> {profile.contactInfo}
              </div>
            )}
            <div>
              <span className="font-semibold">Correo:</span> {profile.email || "Sin correo"}
            </div>
          </div>
          <div className="space-y-2">
            {profile.techStack && (
              <div>
                <span className="font-semibold">Stack tecnológico:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {profile.techStack.split(",").map((tech: string, idx: number) => (
                    <Badge key={idx} variant="secondary">{tech.trim()}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Acerca de */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-2">Acerca de</h2>
          <div className="bg-muted rounded-lg p-4 min-h-[80px]">
            {profile.bio || <span className="text-muted-foreground">Sin información</span>}
          </div>
        </div>
        {/* Sección Estudios */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <svg className="h-6 w-6 text-blue-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 14l9-5-9-5-9 5 9 5z"/><path d="M12 14l6.16-3.422A12.083 12.083 0 0 1 21 13.5c0 2.485-4.03 4.5-9 4.5s-9-2.015-9-4.5c0-.538.214-1.05.84-1.922L12 14z"/></svg>
            Estudios
          </h2>
          <div className="space-y-4">
            {(profile.education && profile.education.length > 0) ? profile.education.map((edu: any, idx: number) => (
              <div key={idx} className="bg-white dark:bg-zinc-900 rounded-lg shadow p-4">
                <div className="font-semibold text-lg">{edu.degree || "Título"}</div>
                <div className="text-muted-foreground">{edu.institution || "Institución"} {edu.years && <span>• {edu.years}</span>}</div>
                {edu.description && <div className="mt-2 text-sm">{edu.description}</div>}
              </div>
            )) : <div className="text-muted-foreground">Sin estudios añadidos.</div>}
          </div>
        </div>
        {/* Sección Experiencia */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3v4M8 3v4M2 11h20"/></svg>
            Experiencia
          </h2>
          <div className="space-y-4">
            {(profile.experience && profile.experience.length > 0) ? profile.experience.map((exp: any, idx: number) => (
              <div key={idx} className="bg-white dark:bg-zinc-900 rounded-lg shadow p-4">
                <div className="font-semibold text-lg">{exp.position || "Puesto"}</div>
                <div className="text-muted-foreground">{exp.company || "Empresa"} {exp.years && <span>• {exp.years}</span>}</div>
                {exp.description && <div className="mt-2 text-sm">{exp.description}</div>}
              </div>
            )) : <div className="text-muted-foreground">Sin experiencia añadida.</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewProfile; 