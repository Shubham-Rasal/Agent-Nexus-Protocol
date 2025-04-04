import * as React from "react";
import { Search as SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Search = React.forwardRef<HTMLInputElement, SearchProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        className={cn(
          "flex h-10 items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-1 focus-within:ring-ring focus-within:ring-offset-2",
          className
        )}
      >
        <SearchIcon className="h-4 w-4 text-muted-foreground mr-2" />
        <input
          type="search"
          className="flex-1 border-0 bg-transparent p-0 shadow-none outline-none focus-visible:outline-none focus-visible:ring-0"
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);

Search.displayName = "Search";

export { Search };