import React, { useEffect, useState } from "react";
import { getAllUsers } from "@/lib/users";
import { getUserProjects } from "@/lib/projects";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom"; // O usa 'next/link' si usas Next.js

const AllUsersProjects = () => {
    const [usersProjects, setUsersProjects] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            setIsLoading(true);
            const users = await getAllUsers();
            const projectsByUser = await Promise.all(
                users.map(async (user: any) => {
                    const projects = await getUserProjects(user.uid);
                    return { user, projects };
                })
            );
            setUsersProjects(projectsByUser);
            setIsLoading(false);
        };
        fetchAll();
    }, []);

    // Calcula la reputación y totales por usuario
    const getUserStats = (user: any, projects: any[]) => {
        const followers = user.followers ? user.followers.length : 0;
        let likes = 0, saves = 0, comments = 0;
        projects.forEach((project) => {
            likes += project.likes || 0;
            saves += project.saves || 0;
            comments += project.commentsCount || 0;
        });
        const reputation = followers * 20 + comments * 1 + saves * 3 + likes * 10;
        return { likes, saves, comments, followers, reputation };
    };

    // Ordenar por reputación descendente
    const sortedUsers = [...usersProjects].sort((a, b) => {
        const aStats = getUserStats(a.user, a.projects);
        const bStats = getUserStats(b.user, b.projects);
        return bStats.reputation - aStats.reputation;
    });

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-2xl font-bold mb-4">Ranking de Usuarios</h1>
            {isLoading ? (
                <div>Cargando...</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900">
                        <thead>
                            <tr className="bg-gray-100 dark:bg-gray-800">
                                <th className="px-4 py-2 text-left text-gray-800 dark:text-gray-200">Usuario</th>
                                <th className="px-4 py-2 text-gray-800 dark:text-gray-200">Likes</th>
                                <th className="px-4 py-2 text-gray-800 dark:text-gray-200">Comentarios</th>
                                <th className="px-4 py-2 text-gray-800 dark:text-gray-200">Guardados</th>
                                <th className="px-4 py-2 text-gray-800 dark:text-gray-200">Seguidores</th>
                                <th className="px-4 py-2 text-gray-800 dark:text-gray-200">Reputación</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedUsers.map(({ user, projects }) => {
                                const stats = getUserStats(user, projects);
                                return (
                                    <tr key={user.uid} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <td className="px-4 py-2">
                                            <Link
                                                to={`/profile/${user.uid}`}
                                                className="text-blue-600 dark:text-blue-400 hover:underline"
                                            >
                                                {user.displayName || user.email}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-2 text-center">{stats.likes}</td>
                                        <td className="px-4 py-2 text-center">{stats.comments}</td>
                                        <td className="px-4 py-2 text-center">{stats.saves}</td>
                                        <td className="px-4 py-2 text-center">{stats.followers}</td>
                                        <td className="px-4 py-2 text-center font-bold">{stats.reputation}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AllUsersProjects;