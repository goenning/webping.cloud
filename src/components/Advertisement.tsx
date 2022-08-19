export function Advertisement() {
  const source = 'webping-cloud'

  return (
    <a
      href={`https://aptakube.com?utm_source=${source}`}
      className="mt-4 mb-20 rounded-xl block relative border bg-zinc-50 p-2 hover:bg-zinc-100 border-zinc-300 overflow-hidden"
    >
      <div className="absolute right-0 top-0">
        <div className="absolute transform rotate-45 bg-emerald-600 text-center text-white font-semibold py-1 right-[-30px] top-[4px] w-[100px]">New!</div>
      </div>
      <div className="flex flex-row items-center">
        <img alt="Aptakube" src="https://avatars.githubusercontent.com/u/108651742?s=80" className="rounded-lg h-8" />
        <span className="ml-2">
          <span className="font-bold">Aptakube</span> for Kubernetes
        </span>
      </div>
      <div className="text-xs mt-2 text-zinc-700">
        Aptakube is a modern, lightweight and multi-cluster Kubernetes desktop client. <br /> Available on Windows, macOS and Linux.
        <span className="text-blue-600 ml-1"> Learn more →</span>
      </div>
    </a>
  )
}
