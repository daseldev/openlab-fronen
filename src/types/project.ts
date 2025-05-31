export interface Project {
  commentsCount: number;
  id: string;
  title: string;
  description: string;
  category: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
  visible: boolean;
  likes?: number;
  likedBy?: string[];
  saves?: number;
  savedBy?: string[];
}

export interface CreateProjectData {
  title: string;
  description: string;
  category: string;
  visible?: boolean;
}

export interface UpdateProjectData {
  title?: string;
  description?: string;
  category?: string;
  visible?: boolean;
} 
export interface ProjectComment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Date;
}