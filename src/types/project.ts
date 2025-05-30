export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
  visible: boolean;
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