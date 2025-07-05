export default function Footer() {
  return (
    <footer className="w-full border-t border-border/40 bg-background">
      <div className="container flex h-3 items-center justify-between py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <a
            href="https://github.com/FIL-Builders/fs-upload-dapp"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Built by FIL-Builders
          </a>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <a
            href="https://github.com/FilOzone/synapse-sdk"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Powered by synapse-sdk
          </a>
        </div>
      </div>
    </footer>
  );
} 