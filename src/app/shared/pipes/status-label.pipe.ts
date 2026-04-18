import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'statusLabel', standalone: true })
export class StatusLabelPipe implements PipeTransform {
  transform(value: string): string {
    const labels: Record<string, string> = {
      PENDING: 'Pendiente',
      IN_PROGRESS: 'En progreso',
      COMPLETED: 'Completado',
      DONE: 'Completado',
      REJECTED: 'Rechazado',
      DRAFT: 'Borrador',
      ACTIVE: 'Activo',
      INACTIVE: 'Inactivo',
    };
    return labels[value] ?? value;
  }
}
