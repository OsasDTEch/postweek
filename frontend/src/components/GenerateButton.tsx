import clsx from "clsx";

interface GenerateButtonProps {
  loading: boolean;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export default function GenerateButton({
  loading,
  label,
  onClick,
  disabled = false,
  className,
}: GenerateButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={clsx("btn-primary gap-2", className)}
    >
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden="true" />
          Generating…
        </>
      ) : (
        label
      )}
    </button>
  );
}
