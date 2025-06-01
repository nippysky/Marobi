import { X } from "lucide-react";
import { useEffect } from "react";

export const VideoModal: React.FC<{ onClose: () => void; videoId: string }> = ({
  onClose,
  videoId,
}) => {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />
      {/* Video Container */}
      <div className="relative z-10">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close video"
          className="absolute top-2 right-2 text-white p-2"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Responsive 16:9 container */}
        <div
          style={{
            width: "90vw",
            maxWidth: "800px",
            aspectRatio: "16/9",
          }}
        >
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            title="Product Video"
            allow="autoplay; encrypted-media"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  );
};
