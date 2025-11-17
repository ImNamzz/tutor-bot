import React from "react";

export const ToDoSidebar: React.FC = () => {
  // Placeholder list items; integrate with real todo data later.
  const items: string[] = [];
  return (
    <aside className="sticky top-4 space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">Captured Events</h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No items yet</p>
      ) : (
        <ul className="space-y-2">
          {items.map((i) => (
            <li key={i} className="p-2 rounded-md bg-muted/60 text-sm">
              {i}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
};
