interface InitOverlayProps { onDone: () => void; }

export default function InitOverlay({ onDone }: InitOverlayProps) {
  return (
    <div className="fixed inset-0 bg-[#022b71]/95 z-[9999] flex items-center justify-center" onClick={onDone}>
      <div className="bg-card rounded-2xl p-8 w-[420px] max-w-[90vw] text-center shadow-2xl">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#7c3aed] mx-auto mb-4" />
        <h2 className="text-lg font-bold mb-1">正在初始化知识库</h2>
        <p className="text-sm text-muted-foreground">正在下载 AI 模型文件...</p>
      </div>
    </div>
  );
}
