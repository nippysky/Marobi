export default function GlobalLoading() {
  return (
    <div
      className="
        fixed inset-0
        z-[9999]
        flex items-center justify-center
        bg-black/75     /* darker semi-transparent overlay */
        backdrop-blur-sm /* subtle blur behind overlay */
      "
    >
      <div className="flex flex-col items-center space-y-4">
        {/* pure CSS spinner */}
        <div
          className="
            animate-spin
            h-12 w-12
            border-4 border-white
            border-t-transparent
            rounded-full
          "
        />
        <p className="text-white text-lg">Loading…</p>
      </div>
    </div>
  )
}
