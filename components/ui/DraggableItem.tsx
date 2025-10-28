"use client";

import { ReactNode } from "react";
import { GripVertical } from "lucide-react";

interface DraggableItemProps {
  index: number;
  onDragStart: (index: number) => void;
  onDragEnter: (index: number) => void;
  onDragEnd: () => void;
  children: ReactNode;
  isDragging?: boolean;
}

export default function DraggableItem({
  index,
  onDragStart,
  onDragEnter,
  onDragEnd,
  children,
  isDragging = false,
}: DraggableItemProps) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragEnter={() => onDragEnter(index)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      className={`relative transition-opacity ${
        isDragging ? "opacity-50" : "opacity-100"
      }`}
    >
      <div className="flex items-start gap-2">
        <div
          className="flex-shrink-0 cursor-grab active:cursor-grabbing p-2 -ml-2 text-gray-400 hover:text-gray-600"
          title="Drag to reorder"
        >
          <GripVertical size={20} />
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
