import { X } from "lucide-react";
import { useEffect } from "react";

/**
 * Extracts YouTube video ID from a full URL or returns null.
 */
function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu")) {
      if (u.pathname === "/watch") {
        const v = u.searchParams.get("v");
        return v ?? null;
      }
      if (u.hostname === "youtu.be") {
        return u.pathname.slice(1) || null;
      }
      // Handles /embed/VIDEOID
      const parts = u.pathname.split("/");
      if (parts.includes("embed")) {
        const embedId = parts.pop();
        return embedId || null;
      }
    }
    return null;
  } catch {
    return null;
  }
}


export const VideoModal: React.FC<{
  onClose: () => void;
  videoUrl: string;
}> = ({ onClose, videoUrl }) => {
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

  const ytId = getYouTubeId(videoUrl);

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
          {ytId ? (
            <iframe
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
              title="Product Video"
              allow="autoplay; encrypted-media"
              allowFullScreen
              className="w-full h-full rounded-lg"
            />
          ) : videoUrl.endsWith(".mp4") ? (
            <video
              src={videoUrl}
              controls
              autoPlay
              className="w-full h-full rounded-lg bg-black"
              style={{ objectFit: "cover" }}
            />
          ) : (
            // fallback for any embed url (could be vimeo, etc)
            <iframe
              src={videoUrl}
              title="Product Video"
              allow="autoplay; encrypted-media"
              allowFullScreen
              className="w-full h-full rounded-lg"
            />
          )}
        </div>
      </div>
    </div>
  );
};
