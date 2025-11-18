import React from "react";

type Props = {
  hideHeader?: boolean;
  className?: string;
};

export const ToDoSidebar: React.FC<Props> = ({
  hideHeader = false,
  className,
}) => {
  // Placeholder list items; integrate with real todo data later.
  const items: string[] = [];
  return (
    <aside className={("space-y-4 " + (className || "")).trim()}>
      {!hideHeader && (
        <h2 className="text-lg font-semibold tracking-tight">
          Captured Events
        </h2>
      )}
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
