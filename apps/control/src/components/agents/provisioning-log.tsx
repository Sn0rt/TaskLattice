export function ProvisioningLog({ lines }: { lines: string[] }) {
  return (
    <div className="min-h-40 bg-zinc-950 p-4 font-mono text-xs leading-6 text-zinc-300">
      {lines.map((line, index) => (
        <div
          key={`${index}-${line}`}
          className="flex gap-4 whitespace-pre-wrap break-words"
        >
          <span className="shrink-0 text-zinc-600">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="min-w-0">
            {line.replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, "")}
          </span>
        </div>
      ))}
    </div>
  );
}
