import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DraggableAttributes,
} from '@dnd-kit/core';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ReactNode } from 'react';

export function useLibrarySortSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
}

export function reorderBySortOrder<T extends { id: string; sortOrder: number }>(
  items: T[],
  activeId: string,
  overId: string,
): T[] {
  const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
  const oldIndex = sorted.findIndex((item) => item.id === activeId);
  const newIndex = sorted.findIndex((item) => item.id === overId);
  if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return items;

  const reordered = arrayMove(sorted, oldIndex, newIndex);
  const orderMap = new Map(reordered.map((item, index) => [item.id, index + 1]));
  return items.map((item) => ({
    ...item,
    sortOrder: orderMap.get(item.id) ?? item.sortOrder,
  }));
}

export function reorderByVolumeOrder<T extends { id: string; volumeOrder: number }>(
  items: T[],
  activeId: string,
  overId: string,
): T[] {
  const sorted = [...items].sort((a, b) => a.volumeOrder - b.volumeOrder);
  const oldIndex = sorted.findIndex((item) => item.id === activeId);
  const newIndex = sorted.findIndex((item) => item.id === overId);
  if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return items;

  const reordered = arrayMove(sorted, oldIndex, newIndex);
  const orderMap = new Map(reordered.map((item, index) => [item.id, index + 1]));
  return items.map((item) => ({
    ...item,
    volumeOrder: orderMap.get(item.id) ?? item.volumeOrder,
  }));
}

type DragHandleProps = {
  disabled?: boolean;
  setActivatorNodeRef?: (element: HTMLElement | null) => void;
  attributes?: DraggableAttributes;
  listeners?: SyntheticListenerMap;
};

export function LibraryDragHandle({
  disabled,
  setActivatorNodeRef,
  attributes,
  listeners,
}: DragHandleProps) {
  return (
    <button
      type="button"
      ref={setActivatorNodeRef}
      className={`library-drag-handle${disabled ? ' is-disabled' : ''}`}
      aria-label={disabled ? '当前不可排序' : '拖拽排序'}
      title={disabled ? '清除筛选后可拖拽排序' : '拖拽排序'}
      disabled={disabled}
      onClick={(event) => event.stopPropagation()}
      {...attributes}
      {...listeners}
    >
      <span className="library-drag-handle-bars" aria-hidden />
    </button>
  );
}

type SortableSeriesCardProps = {
  id: string;
  dragDisabled?: boolean;
  onEnter: () => void;
  children: ReactNode;
  footerStat: ReactNode;
};

export function SortableSeriesCard({
  id,
  dragDisabled,
  onEnter,
  children,
  footerStat,
}: SortableSeriesCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: dragDisabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`library-series-card${isDragging ? ' is-dragging' : ''}`}
    >
      <div className="library-series-card-head">
        <LibraryDragHandle
          disabled={dragDisabled}
          setActivatorNodeRef={setActivatorNodeRef}
          attributes={attributes}
          listeners={listeners}
        />
        <div className="library-series-card-main">{children}</div>
      </div>
      <div className="library-series-card-aside">
        <span className="library-series-stat">{footerStat}</span>
        <button type="button" className="btn btn-primary library-series-enter-btn" onClick={onEnter}>
          进入系列
        </button>
      </div>
    </div>
  );
}

type SortableBookRowProps = {
  id: string;
  dragDisabled?: boolean;
  onOpen: () => void;
  children: (parts: {
    dragHandle: ReactNode;
    volumeBadge: ReactNode;
  }) => ReactNode;
  volumeOrder: number;
};

export function SortableBookRow({
  id,
  dragDisabled,
  onOpen,
  children,
  volumeOrder,
}: SortableBookRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: dragDisabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dragHandle = (
    <LibraryDragHandle
      disabled={dragDisabled}
      setActivatorNodeRef={setActivatorNodeRef}
      attributes={attributes}
      listeners={listeners}
    />
  );

  const volumeBadge = <span className="library-volume-badge">第 {volumeOrder} 册</span>;

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`library-book-row${isDragging ? ' is-dragging' : ''}`}
      onClick={onOpen}
    >
      {children({ dragHandle, volumeBadge })}
    </tr>
  );
}

type SeriesSortableGridProps = {
  itemIds: string[];
  dragDisabled?: boolean;
  onDragEnd: (event: DragEndEvent) => void;
  children: ReactNode;
};

export function SeriesSortableGrid({ itemIds, onDragEnd, children }: SeriesSortableGridProps) {
  const sensors = useLibrarySortSensors();

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div className="library-series-grid">{children}</div>
      </SortableContext>
    </DndContext>
  );
}

type BookSortableTableBodyProps = {
  itemIds: string[];
  dragDisabled?: boolean;
  onDragEnd: (event: DragEndEvent) => void;
  children: ReactNode;
};

export function BookSortableTableBody({ itemIds, onDragEnd, children }: BookSortableTableBodyProps) {
  const sensors = useLibrarySortSensors();

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <tbody>{children}</tbody>
      </SortableContext>
    </DndContext>
  );
}
