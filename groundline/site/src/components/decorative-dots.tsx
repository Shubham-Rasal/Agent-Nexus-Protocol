export function DecorativeDots() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <div className="absolute top-[15%] left-[10%] w-1 h-1 bg-foreground/20 rounded-full" />
      <div className="absolute top-[25%] right-[15%] w-1 h-1 bg-foreground/20 rounded-full" />
      <div className="absolute top-[45%] left-[20%] w-1 h-1 bg-foreground/20 rounded-full" />
      <div className="absolute top-[60%] right-[25%] w-1 h-1 bg-foreground/20 rounded-full" />
      <div className="absolute top-[75%] left-[30%] w-1 h-1 bg-foreground/20 rounded-full" />
      <div className="absolute top-[35%] right-[40%] w-1 h-1 bg-foreground/20 rounded-full" />
      <div className="absolute bottom-[20%] right-[10%] w-1 h-1 bg-foreground/20 rounded-full" />
      <div className="absolute top-[50%] left-[45%] w-1 h-1 bg-foreground/20 rounded-full" />
    </div>
  )
}
