interface LoadingViewProps {
  message?: string;
}

export function LoadingView({ message }: LoadingViewProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-page-bg gap-4 font-plus-jakarta select-none">
      <div className="relative">
        {/* Animated outer dashed ring for playful look */}
        <div className="absolute inset-0 rounded-full border-4 border-dashed border-accent-orange/40 animate-spin duration-3000"></div>
        {/* Solid active spinner */}
        <div className="rounded-full h-12 w-12 border-t-4 border-l-4 border-accent-orange animate-spin"></div>
      </div>
      {message ? (
        <p className="text-main-text font-nunito font-black text-sm animate-pulse tracking-wide uppercase">{message}</p>
      ) : (
        <p className="text-main-text/60 font-nunito font-black text-xs animate-pulse tracking-widest uppercase">
          S<span className="text-accent-orange">/</span>L<span className="text-accent-orange">/</span>I<span className="text-accent-orange">/</span>C<span className="text-accent-orange">/</span>E
        </p>
      )}
    </div>
  );
}
