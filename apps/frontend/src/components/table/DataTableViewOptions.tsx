'use client';

import { Settings2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';

export interface DataTableViewOption {
  id: string;
  label: string;
  isActive: boolean;
}

interface DataTableViewOptionsProps {
  columns: DataTableViewOption[];
  onChange: (id: string, isActive: boolean) => void;
}

export function DataTableViewOptions({ columns, onChange }: DataTableViewOptionsProps) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm" className="ml-auto h-8">
            <Settings2 className="w-4 h-4 mr-1" />
            Hiển thị cột
          </Button>
        }
      />
      <PopoverContent align="end" className="w-48 p-2">
        <div className="text-xs font-semibold text-muted-foreground px-2 py-1">Hiển thị cột</div>
        <div className="h-px bg-border my-1" />
        <div className="space-y-1">
          {columns.map((column) => (
            <label
              key={column.id}
              className="flex items-center gap-2 px-2 py-1.5 text-xs rounded-md hover:bg-muted cursor-pointer"
            >
              <input
                type="checkbox"
                checked={column.isActive}
                onChange={(e) => onChange(column.id, e.target.checked)}
                className="rounded text-primary focus:ring-primary"
              />
              <span>{column.label}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
