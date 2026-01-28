import { useState } from 'react';
import { 
  MoreHorizontal, 
  Pencil, 
  Palette, 
  Move, 
  Copy, 
  Archive, 
  Trash, 
  Star, 
  Link as LinkIcon 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Button } from "@/shared/components/ui/button";
import { Project } from '../types/project.types';
import { projectService } from '../services/projectService';
// We might need a toast notification here later

interface ProjectActionsMenuProps {
  project: Project;
  variant?: 'ghost' | 'default';
  className?: string;
  onProjectUpdated?: () => void;
  onProjectDeleted?: () => void;
}

export function ProjectActionsMenu({ 
  project, 
  variant = 'ghost', 
  className,
  onProjectUpdated,
  onProjectDeleted
}: ProjectActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleCopyLink = async () => {
    // Assuming the URL structure is predictable, or we just copy the ID for now if no dedicated page
    const url = `${window.location.origin}/dashboard/projects/${project.id}`; // Adjusted URL assumption
    try {
      await navigator.clipboard.writeText(url);
      // alert('Enlace copiado al portapapeles'); // Replace with toast
      console.log('Enlace copiado');
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDelete = async () => {
    if (confirm('¿Estás seguro de que quieres eliminar este proyecto? Esta acción no se puede deshacer.')) {
      try {
        await projectService.deleteProject(project.id);
        onProjectDeleted?.();
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Error al eliminar el proyecto');
      }
    }
  };

  const handleDuplicate = async () => {
    try {
      await projectService.duplicateProject(project);
      onProjectUpdated?.();
      // alert('Proyecto duplicado');
    } catch (error) {
      console.error('Error duplicating project:', error);
      alert('Error al duplicar el proyecto');
    }
  };

  const handleArchive = async () => {
    try {
      await projectService.updateProjectStatus(project.id, 'completado'); // Archive mapped to Completed for now
      onProjectUpdated?.();
    } catch (error) {
      console.error('Error archiving project:', error);
    }
  };

    const handleRename = async () => {
        const newName = prompt('Nuevo nombre del proyecto:', project.name);
        if (newName && newName !== project.name) {
             try {
                await projectService.updateProject(project.id, { name: newName });
                onProjectUpdated?.();
            } catch (error) {
                console.error('Error renaming project:', error);
            }
        }
    };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button variant={variant} className={`h-8 w-8 p-0 hover:bg-gray-100 rounded-lg ${className}`}>
          <span className="sr-only">Menú de acciones</span>
          <MoreHorizontal className="h-5 w-5 text-gray-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem className="cursor-pointer" onClick={(e) => { e.stopPropagation(); /* Handle Favorite */ }}>
          <Star className="mr-2 h-4 w-4" />
          <span>Favorito</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onClick={(e) => { e.stopPropagation(); handleRename(); }}>
          <Pencil className="mr-2 h-4 w-4" />
          <span>Cambiar nombre</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onClick={(e) => { e.stopPropagation(); handleCopyLink(); }}>
          <LinkIcon className="mr-2 h-4 w-4" />
          <span>Copiar enlace</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onClick={(e) => e.stopPropagation()}>
          <Palette className="mr-2 h-4 w-4" />
          <span>Color e icono</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onClick={(e) => e.stopPropagation()}>
          <Move className="mr-2 h-4 w-4" />
          <span>Mover</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onClick={(e) => { e.stopPropagation(); handleDuplicate(); }}>
          <Copy className="mr-2 h-4 w-4" />
          <span>Duplicar</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onClick={(e) => { e.stopPropagation(); handleArchive(); }}>
          <Archive className="mr-2 h-4 w-4" />
          <span>Archivar</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50" onClick={(e) => { e.stopPropagation(); handleDelete(); }}>
          <Trash className="mr-2 h-4 w-4" />
          <span>Eliminar</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
