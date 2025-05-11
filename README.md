# Mi OpenLab

## Descripción del Proyecto

**Mi OpenLab** es una plataforma donde los usuarios pueden crear, gestionar y explorar proyectos innovadores en diversas categorías como Desarrollo Web, Inteligencia Artificial, Seguridad, IoT, y más. Los usuarios pueden registrar sus proyectos, editarlos y eliminarlos en su perfil, mientras exploran proyectos creados por otros usuarios.

El proyecto tiene una estructura moderna y responsive, adaptándose tanto al modo claro como al modo oscuro. Es ideal para estudiantes, desarrolladores y creativos que buscan compartir sus ideas y aprender de otros en la comunidad.

### Funcionalidades Principales:
- **Autenticación de usuarios:** Permite a los usuarios registrarse, iniciar sesión y cerrar sesión usando Firebase Authentication.
- **Gestión de proyectos:** Los usuarios pueden crear, editar y eliminar proyectos. Cada proyecto tiene un título, descripción y categoría.
- **Exploración pública:** Los proyectos se pueden explorar públicamente, y los usuarios pueden ver detalles de cada proyecto.
- **Modo oscuro:** El portal soporta un tema oscuro para una experiencia visual óptima en cualquier entorno.

## Tecnologías Utilizadas

Este proyecto utiliza una serie de tecnologías modernas para garantizar un rendimiento y una experiencia de usuario excepcionales:

- **React**: Biblioteca para la construcción de interfaces de usuario.
- **Firebase**: Para la autenticación de usuarios y almacenamiento de proyectos.
- **Vite**: Herramienta de desarrollo rápida para crear aplicaciones con React.
- **TailwindCSS**: Framework de CSS para estilizar la aplicación con clases de utilidad.
- **React Router**: Para la navegación entre las páginas de la aplicación.
- **Lucide React Icons**: Para el uso de íconos en la interfaz.
- **TypeScript**: Lenguaje de programación que extiende JavaScript, agregando tipado estático a la aplicación.


## Instrucciones de Instalación y Despliegue Local

### Requisitos Previos

Asegúrate de tener las siguientes herramientas instaladas en tu sistema:

- [Node.js](https://nodejs.org/) (versión 16 o superior)
- [npm](https://www.npmjs.com/) (gestor de paquetes de Node.js, que normalmente viene con Node.js)
- [Git](https://git-scm.com/) (para clonar el repositorio)

### 1. Clonar el repositorio

Primero, clona el repositorio en tu máquina local:

```bash
git clone https://github.com/daseldev/openlab-fronen
```

### 2. Instalar las dependencias

Navega al directorio del proyecto:

```bash
cd mi-openlab
```

Instala las dependencias utilizando `npm`:

```bash
npm install
```

### 3. Configuración de Firebase

Para conectar tu aplicación con Firebase, necesitarás configurar un proyecto de Firebase y agregar las variables de configuración en tu archivo `.env`:

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/).
2. Activa **Firebase Authentication** y **Firestore Database** en tu consola de Firebase.
3. Crea un archivo `.env` en la raíz de tu proyecto y agrega las siguientes variables de entorno con los valores obtenidos de la consola de Firebase:

```env
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID
VITE_FIREBASE_MEASUREMENT_ID=YOUR_MEASUREMENT_ID
```

### 4. Correr la aplicación

Ahora que todo está configurado, ejecuta:

```bash
npm run dev
```

Esto iniciará el servidor de desarrollo en `http://localhost:3000`. Abre esa URL en tu navegador para ver la aplicación en acción.