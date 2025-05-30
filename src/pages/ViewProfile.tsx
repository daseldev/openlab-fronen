import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Pencil, Linkedin, Github, Instagram } from "lucide-react";
import { X as XIcon } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Mail, Phone, Globe } from "lucide-react";

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
    <div className="min-h-screen bg-background flex justify-center py-8">
      <div className="w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden">
        {/* Header tipo LinkedIn */}
        <div className="relative w-full h-48 bg-gradient-to-r from-slate-200 to-blue-200 dark:from-blue-900 dark:to-blue-600">
          {/* Botón editar perfil como lápiz */}
          {currentUser?.uid === userId && (
            <button
              className="absolute top-4 right-4 z-20 bg-white/80 hover:bg-white p-2 rounded-full shadow border border-gray-200"
              onClick={() => navigate("/profile/edit")}
              title="Editar perfil"
            >
              <Pencil className="h-5 w-5 text-gray-700" />
            </button>
          )}
          {/* Avatar superpuesto */}
          <div className="absolute left-8 -bottom-16">
            <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
              <AvatarImage src={profile.photoURL} />
              <AvatarFallback className="text-4xl">{getUserInitials()}</AvatarFallback>
            </Avatar>
          </div>
        </div>
        {/* Info principal */}
        <div className="flex flex-row justify-between pt-20 pb-8 px-8">
          {/* Columna izquierda: datos principales */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-bold truncate">{profile.displayName || "Sin nombre"}</h1>
              {/* (Opcional) Insignia de verificación */}
              {/* <span className="ml-2 px-2 py-0.5 border border-blue-400 text-blue-600 rounded-full text-xs font-semibold">Añadir insignia de verificación</span> */}
            </div>
            {profile.headline && (
              <div className="text-lg text-muted-foreground mb-1 truncate">{profile.headline}</div>
            )}
            {profile.techStack && (
              <div className="text-base text-muted-foreground mb-1 truncate">{profile.techStack}</div>
            )}
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-300 mb-2">
              {profile.location && <span>{profile.location}</span>}
              <span>•</span>
              {/* Hipervínculo Información de contacto */}
              <Dialog>
                <DialogTrigger asChild>
                  <button className="underline text-blue-500 hover:text-blue-700 font-medium cursor-pointer">Información de contacto</button>
                </DialogTrigger>
                <DialogContent className="max-w-md mx-auto">
                  <h2 className="text-xl font-bold mb-4">Información de contacto</h2>
                  <div className="space-y-4">
                    {profile.contactInfo && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-gray-500" />
                        <span>{profile.contactInfo}</span>
                      </div>
                    )}
                    {profile.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-gray-500" />
                        <span>{profile.email}</span>
                      </div>
                    )}
                    {profile.linkedin && (
                      <div className="flex items-center gap-3">
                        <Linkedin className="h-5 w-5 text-[#0A66C2]" />
                        <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">LinkedIn</a>
                      </div>
                    )}
                    {profile.github && (
                      <div className="flex items-center gap-3">
                        <Github className="h-5 w-5 text-[#181717]" />
                        <a href={profile.github} target="_blank" rel="noopener noreferrer" className="text-gray-900 dark:text-gray-100 hover:underline">GitHub</a>
                      </div>
                    )}
                    {profile.instagram && (
                      <div className="flex items-center gap-3">
                        <Instagram className="h-5 w-5 text-pink-500" />
                        <a href={profile.instagram} target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:underline">Instagram</a>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {/* (Opcional) Número de contactos */}
            {/* <div className="text-blue-600 font-medium cursor-pointer">116 contactos</div> */}
          </div>
          {/* Columna derecha: organizaciones/universidad (placeholder) */}
          <div className="flex flex-col items-end gap-2 min-w-[180px]">
            {/* Ejemplo de logos, puedes reemplazar por tus datos reales */}
            <div className="flex items-center gap-2">
              <img src="https://upload.wikimedia.org/wikipedia/commons/5/50/ACM_logo.svg" alt="ACM" className="h-8 w-8 rounded bg-white p-1 border" />
              <span className="text-sm font-medium">ACM, Association for Computing Machinery</span>
            </div>
            <div className="flex items-center gap-2">
              <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/Logo_UNAL_2016.svg" alt="Universidad" className="h-8 w-8 rounded bg-white p-1 border" />
              <span className="text-sm font-medium">Universidad del Norte</span>
            </div>
          </div>
        </div>
        {/* Info lateral tipo LinkedIn */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
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
        {/* Sección Idiomas */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20v-6M12 4v2m0 0a8 8 0 1 1-8 8"/></svg>
            Idiomas
          </h2>
          <div className="flex flex-wrap gap-3 mt-2">
            {(profile.languages && profile.languages.length > 0) ? profile.languages.map((lang: any, idx: number) => (
              <span key={idx} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100 font-medium shadow">
                <span>{lang.language}</span>
                <span className="text-xs bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded px-2 py-0.5">{lang.level}</span>
              </span>
            )) : <span className="text-muted-foreground">Sin idiomas añadidos.</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewProfile; 