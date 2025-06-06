import React, { useState, useEffect, useRef } from "react";
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
import { useNavigate } from "react-router-dom";

const EditProfile = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(currentUser?.displayName || "");
  const [bio, setBio] = useState("");
  const [photoURL, setPhotoURL] = useState(currentUser?.photoURL || "");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [headline, setHeadline] = useState("");
  const [location, setLocation] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [techStack, setTechStack] = useState("");
  const [headerURL, setHeaderURL] = useState("");
  const [selectedHeaderFile, setSelectedHeaderFile] = useState<File | null>(null);
  const [headerPreviewUrl, setHeaderPreviewUrl] = useState<string | null>(null);
  const [education, setEducation] = useState<any[]>([]);
  const [experience, setExperience] = useState<any[]>([]);
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [twitter, setTwitter] = useState("");
  const [instagram, setInstagram] = useState("");
  const [languages, setLanguages] = useState<any[]>([]);
  const languageOptions = [
    "Español", "Inglés", "Francés", "Alemán", "Italiano", "Portugués", "Chino", "Japonés", "Ruso", "Árabe", "Hindi", "Coreano", "Turco", "Polaco", "Holandés", "Sueco", "Danés", "Finlandés", "Noruego", "Griego", "Checo", "Húngaro", "Rumano", "Hebreo", "Tailandés", "Vietnamita", "Indonesio", "Malayo", "Filipino", "Ucraniano", "Catalán"
  ];
  const levelOptions = ["Básico", "Intermedio", "Avanzado", "Nativo"];
  const [languageSuggestions, setLanguageSuggestions] = useState<string[]>([]);
  const [errors, setErrors] = useState<any>({});
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const locationTimeout = useRef<NodeJS.Timeout | null>(null);

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
            setHeadline(userData.headline || "");
            setLocation(userData.location || "");
            setContactInfo(userData.contactInfo || "");
            setTechStack(userData.techStack || "");
            setHeaderURL(userData.headerURL || "");
            setEducation(userData.education || []);
            setExperience(userData.experience || []);
            setLinkedin(userData.linkedin || "");
            setGithub(userData.github || "");
            setTwitter(userData.twitter || "");
            setInstagram(userData.instagram || "");
            setLanguages(userData.languages || []);
          } else {
            // Si no existe el documento, lo creamos
            await setDoc(doc(db, "users", currentUser.uid), {
              bio: "",
              displayName: currentUser.displayName || "",
              photoURL: currentUser.photoURL || "",
              email: currentUser.email,
              headline: "",
              location: "",
              contactInfo: "",
              techStack: "",
              headerURL: "",
              education: [],
              experience: [],
              linkedin: "",
              github: "",
              twitter: "",
              instagram: "",
              languages: [],
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

  const handleHeaderFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedHeaderFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setHeaderPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadHeaderImage = async (file: File): Promise<string> => {
    const storage = getStorage();
    const storageRef = ref(storage, `profile_headers/${currentUser?.uid}/${file.name}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  const validate = () => {
    const newErrors: any = {};
    if (!displayName || displayName.trim().length < 2) newErrors.displayName = "El nombre es obligatorio (mínimo 2 caracteres).";
    if (!headline || headline.trim().length < 5) newErrors.headline = "El titular es obligatorio (mínimo 5 caracteres).";
    if (contactInfo && !/^\d{10}$/.test(contactInfo)) newErrors.contactInfo = "Debe ser un número de teléfono válido (10 dígitos) o dejarse vacío.";
    if (!bio || bio.trim().length < 10) newErrors.bio = "El campo 'Acerca de' es obligatorio (mínimo 10 caracteres).";
    education.forEach((edu, idx) => {
      if (!edu.institution || edu.institution.trim() === "") newErrors[`education_institution_${idx}`] = "La institución es obligatoria.";
      if (!edu.degree || edu.degree.trim() === "") newErrors[`education_degree_${idx}`] = "El título es obligatorio.";
      if (!edu.years || !/^\d{4}(-\d{4})?$/.test(edu.years)) newErrors[`education_years_${idx}`] = "Años obligatorio (formato: 2020 o 2020-2023).";
    });
    experience.forEach((exp, idx) => {
      if (!exp.company || exp.company.trim() === "") newErrors[`experience_company_${idx}`] = "La empresa es obligatoria.";
      if (!exp.position || exp.position.trim() === "") newErrors[`experience_position_${idx}`] = "El puesto es obligatorio.";
      if (!exp.years || !/^\d{4}(-\d{4})?$/.test(exp.years)) newErrors[`experience_years_${idx}`] = "Años obligatorio (formato: 2020 o 2020-2023).";
    });
    if (linkedin && !/^https:\/\/(www\.)?linkedin\.com\/.+/.test(linkedin)) newErrors.linkedin = "Debe ser una URL válida de LinkedIn.";
    if (github && !/^https:\/\/(www\.)?github\.com\/.+/.test(github)) newErrors.github = "Debe ser una URL válida de GitHub.";
    if (twitter && !/^https:\/\/(www\.)?(twitter\.com|x\.com)\/.+/.test(twitter)) newErrors.twitter = "Debe ser una URL válida de X (antes Twitter).";
    if (instagram && !/^https:\/\/(www\.)?instagram\.com\/.+/.test(instagram)) newErrors.instagram = "Debe ser una URL válida de Instagram.";
    // Validación de idiomas
    const languageSet = new Set();
    languages.forEach((lang, idx) => {
      if (!lang.language || !lang.level) newErrors[`language_${idx}`] = "Completa ambos campos.";
      if (languageSet.has(lang.language)) newErrors[`language_${idx}`] = "No repitas idiomas.";
      languageSet.add(lang.language);
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!validate()) return;
    setIsLoading(true);

    try {
      let newPhotoURL = photoURL;
      let newHeaderURL = headerURL;

      if (selectedFile) {
        newPhotoURL = await uploadProfileImage(selectedFile);
      }

      if (selectedHeaderFile) {
        newHeaderURL = await uploadHeaderImage(selectedHeaderFile);
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
        headline,
        location,
        contactInfo,
        techStack,
        headerURL: newHeaderURL,
        education,
        experience,
        linkedin,
        github,
        twitter,
        instagram,
        languages,
      });

      toast({
        title: "Perfil actualizado",
        description: "Tu perfil ha sido actualizado correctamente.",
      });

      // Limpiar el archivo seleccionado después de guardar
      setSelectedFile(null);
      setPreviewUrl(null);
      setSelectedHeaderFile(null);
      setHeaderPreviewUrl(null);

      // Redirigir al perfil público
      navigate(`/profile/${currentUser.uid}`);
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

  // Validar en tiempo real
  useEffect(() => {
    validate();
    // eslint-disable-next-line
  }, [displayName, headline, contactInfo, bio, education, experience, linkedin, github, twitter, instagram]);

  // Autocompletar ubicación
  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocation(e.target.value);
    if (locationTimeout.current) clearTimeout(locationTimeout.current);
    const value = e.target.value;
    if (value.length < 2) {
      setLocationSuggestions([]);
      return;
    }
    locationTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&addressdetails=1&limit=5`);
        const data = await res.json();
        setLocationSuggestions(
          data.map((item: any) => {
            const city = item.address.city || item.address.town || item.address.village || "";
            const state = item.address.state || "";
            const country = item.address.country || "";
            return [city, state, country].filter(Boolean).join(", ");
          })
        );
      } catch {
        setLocationSuggestions([]);
      }
    }, 400);
  };

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-3xl font-bold mb-8">Mi Perfil</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative group">
            <Avatar className="h-32 w-32">
              <AvatarImage src={previewUrl || photoURL} />
              <AvatarFallback className="text-4xl">{getUserInitials()}</AvatarFallback>
            </Avatar>
            {/* Overlay para editar imagen */}
            <label
              htmlFor="photo-upload"
              className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full"
              title="Cambiar foto de perfil"
              style={{ zIndex: 10 }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-10 w-10"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M5 7h2l2-3h6l2 3h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" />
              </svg>
              <Input
                id="photo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>
        </div>

        {/* Header editable */}
        <div className="relative w-full h-48 mb-20 group">
          <img
            src={headerPreviewUrl || headerURL || "/default-header.jpg"}
            alt="Header"
            className="object-cover w-full h-full rounded-lg"
          />
          <label
            htmlFor="header-upload"
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-lg"
            style={{ zIndex: 10 }}
            title="Cambiar imagen de portada"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-10 w-10"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M5 7h2l2-3h6l2 3h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" />
            </svg>
            <Input
              id="header-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleHeaderFileChange}
            />
          </label>
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
            {errors.displayName && <p className="text-red-500 text-sm mt-1">{errors.displayName}</p>}
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
            <Label htmlFor="headline">Titular</Label>
            <Input
              id="headline"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Ej: Desarrollador Full Stack, UX Designer, etc."
            />
            {errors.headline && <p className="text-red-500 text-sm mt-1">{errors.headline}</p>}
          </div>

          <div className="space-y-2 relative">
            <Label htmlFor="location">Ubicación</Label>
            <Input
              id="location"
              value={location}
              onChange={handleLocationChange}
              placeholder="Ciudad, País"
              autoComplete="off"
            />
            {locationSuggestions.length > 0 && (
              <div className="absolute z-20 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded shadow w-full mt-1 max-h-48 overflow-y-auto">
                {locationSuggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    className="px-4 py-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900"
                    onClick={() => {
                      setLocation(suggestion);
                      setLocationSuggestions([]);
                    }}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactInfo">Información de contacto</Label>
            <Input
              id="contactInfo"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              placeholder="Email, teléfono, redes sociales..."
            />
            {errors.contactInfo && <p className="text-red-500 text-sm mt-1">{errors.contactInfo}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="techStack">Stack tecnológico</Label>
            <Input
              id="techStack"
              value={techStack}
              onChange={(e) => setTechStack(e.target.value)}
              placeholder="Ej: React, Node.js, Python, ..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Acerca de</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Cuéntanos sobre ti..."
              className="min-h-[100px]"
            />
            {errors.bio && <p className="text-red-500 text-sm mt-1">{errors.bio}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedin">LinkedIn</Label>
            <Input
              id="linkedin"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://www.linkedin.com/in/tuusuario"
            />
            {errors.linkedin && <p className="text-red-500 text-sm mt-1">{errors.linkedin}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="github">GitHub</Label>
            <Input
              id="github"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              placeholder="https://github.com/tuusuario"
            />
            {errors.github && <p className="text-red-500 text-sm mt-1">{errors.github}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="twitter">X (antes Twitter)</Label>
            <Input
              id="twitter"
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              placeholder="https://x.com/tuusuario"
            />
            {errors.twitter && <p className="text-red-500 text-sm mt-1">{errors.twitter}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram</Label>
            <Input
              id="instagram"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="https://instagram.com/tuusuario"
            />
            {errors.instagram && <p className="text-red-500 text-sm mt-1">{errors.instagram}</p>}
          </div>
        </div>

        {/* Sección Estudios */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <svg className="h-6 w-6 text-blue-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422A12.083 12.083 0 0 1 21 13.5c0 2.485-4.03 4.5-9 4.5s-9-2.015-9-4.5c0-.538.214-1.05.84-1.922L12 14z" /></svg>
            Estudios
          </h2>
          <div className="space-y-4">
            {education.map((edu, idx) => (
              <div key={idx} className="bg-white dark:bg-zinc-900 rounded-lg shadow p-4 flex flex-col gap-1 relative">
                <button type="button" className="absolute top-2 right-2 text-red-500" onClick={() => setEducation(education.filter((_, i) => i !== idx))}>✕</button>
                <Input className="mb-1" placeholder="Institución" value={edu.institution} onChange={e => {
                  const arr = [...education]; arr[idx].institution = e.target.value; setEducation(arr);
                }} />
                {errors[`education_institution_${idx}`] && <p className="text-red-500 text-sm mt-1">{errors[`education_institution_${idx}`]}</p>}
                <Input className="mb-1" placeholder="Título" value={edu.degree} onChange={e => {
                  const arr = [...education]; arr[idx].degree = e.target.value; setEducation(arr);
                }} />
                {errors[`education_degree_${idx}`] && <p className="text-red-500 text-sm mt-1">{errors[`education_degree_${idx}`]}</p>}
                <Input className="mb-1" placeholder="Años (ej: 2018-2022)" value={edu.years} onChange={e => {
                  const arr = [...education]; arr[idx].years = e.target.value; setEducation(arr);
                }} />
                {errors[`education_years_${idx}`] && <p className="text-red-500 text-sm mt-1">{errors[`education_years_${idx}`]}</p>}
                <Textarea className="mb-1" placeholder="Descripción" value={edu.description} onChange={e => {
                  const arr = [...education]; arr[idx].description = e.target.value; setEducation(arr);
                }} />
              </div>
            ))}
            <Button type="button" variant="outline" className="mt-2" onClick={() => setEducation([...education, { institution: "", degree: "", years: "", description: "" }])}>Añadir estudio</Button>
          </div>
        </div>
        {/* Sección Experiencia */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 3v4M8 3v4M2 11h20" /></svg>
            Experiencia
          </h2>
          <div className="space-y-4">
            {experience.map((exp, idx) => (
              <div key={idx} className="bg-white dark:bg-zinc-900 rounded-lg shadow p-4 flex flex-col gap-1 relative">
                <button type="button" className="absolute top-2 right-2 text-red-500" onClick={() => setExperience(experience.filter((_, i) => i !== idx))}>✕</button>
                <Input className="mb-1" placeholder="Empresa" value={exp.company} onChange={e => {
                  const arr = [...experience]; arr[idx].company = e.target.value; setExperience(arr);
                }} />
                {errors[`experience_company_${idx}`] && <p className="text-red-500 text-sm mt-1">{errors[`experience_company_${idx}`]}</p>}
                <Input className="mb-1" placeholder="Puesto" value={exp.position} onChange={e => {
                  const arr = [...experience]; arr[idx].position = e.target.value; setExperience(arr);
                }} />
                {errors[`experience_position_${idx}`] && <p className="text-red-500 text-sm mt-1">{errors[`experience_position_${idx}`]}</p>}
                <Input className="mb-1" placeholder="Años (ej: 2020-2023)" value={exp.years} onChange={e => {
                  const arr = [...experience]; arr[idx].years = e.target.value; setExperience(arr);
                }} />
                {errors[`experience_years_${idx}`] && <p className="text-red-500 text-sm mt-1">{errors[`experience_years_${idx}`]}</p>}
                <Textarea className="mb-1" placeholder="Descripción" value={exp.description} onChange={e => {
                  const arr = [...experience]; arr[idx].description = e.target.value; setExperience(arr);
                }} />
              </div>
            ))}
            <Button type="button" variant="outline" className="mt-2" onClick={() => setExperience([...experience, { company: "", position: "", years: "", description: "" }])}>Añadir experiencia</Button>
          </div>
        </div>

        {/* Sección Idiomas */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20v-6M12 4v2m0 0a8 8 0 1 1-8 8" /></svg>
            Idiomas
          </h2>
          <div className="space-y-4">
            {languages.map((lang, idx) => (
              <div key={idx} className="bg-white dark:bg-zinc-900 rounded-lg shadow p-4 flex flex-col gap-1 relative">
                <button type="button" className="absolute top-2 right-2 text-red-500" onClick={() => setLanguages(languages.filter((_, i) => i !== idx))}>✕</button>
                <div className="flex gap-2 mb-1">
                  <div className="relative w-1/2">
                    <Input
                      placeholder="Idioma"
                      value={lang.language}
                      onChange={e => {
                        const val = e.target.value;
                        const arr = [...languages];
                        arr[idx].language = val;
                        setLanguages(arr);
                        if (val.length > 0) {
                          setLanguageSuggestions(languageOptions.filter(opt => opt.toLowerCase().includes(val.toLowerCase()) && !languages.some(l => l.language === opt)));
                        } else {
                          setLanguageSuggestions([]);
                        }
                      }}
                      autoComplete="off"
                    />
                    {languageSuggestions.length > 0 && lang.language && (
                      <div className="absolute z-20 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded shadow w-full mt-1 max-h-32 overflow-y-auto">
                        {languageSuggestions.map((suggestion, sidx) => (
                          <div
                            key={sidx}
                            className="px-4 py-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900"
                            onClick={() => {
                              const arr = [...languages];
                              arr[idx].language = suggestion;
                              setLanguages(arr);
                              setLanguageSuggestions([]);
                            }}
                          >
                            {suggestion}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <select
                    className="w-1/2 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                    value={lang.level}
                    onChange={e => {
                      const arr = [...languages];
                      arr[idx].level = e.target.value;
                      setLanguages(arr);
                    }}
                  >
                    <option value="">Nivel</option>
                    {levelOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                {errors[`language_${idx}`] && <p className="text-red-500 text-sm mt-1">{errors[`language_${idx}`]}</p>}
              </div>
            ))}
            <Button type="button" variant="outline" className="mt-2" onClick={() => setLanguages([...languages, { language: "", level: "" }])}>Añadir idioma</Button>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading || Object.keys(errors).length > 0}>
          {isLoading ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </form>
    </div>
  );
};

export default EditProfile; 