import { CopyButton } from "./CopyButton";

export function CodeBox({ text }: { text: string }) {
  return (
    <div className="flex min-w-0 items-start gap-2 rounded-lg border border-line bg-surface p-2 pl-3">
      <pre className="min-w-0 flex-1 overflow-x-auto py-1 text-[13px] leading-5">
        <code>{text}</code>
      </pre>
      <CopyButton text={text} />
    </div>
  );
}
