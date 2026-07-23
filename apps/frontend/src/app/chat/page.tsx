export default function ChatEmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center h-full">
      <div className="text-center text-muted-foreground bg-background/50 backdrop-blur-sm py-2 px-4 rounded-full text-sm shadow-sm border">
        Select a chat to start messaging
      </div>
    </div>
  );
}
