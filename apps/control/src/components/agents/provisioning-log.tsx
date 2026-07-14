export function ProvisioningLog({ lines }: { lines: string[] }) {
  return (
    <div className="min-h-40 rounded-lg bg-zinc-950 p-4 font-mono text-xs leading-6 text-zinc-300">
      {lines.map((line, index) => (
        <div key={`${index}-${line}`}>
          <span className="mr-4 text-zinc-600">
            {String(index + 1).padStart(2, "0")}
          </span>
          {line}
        </div>
      ))}
    </div>
  );
}
