export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="bg-graphite border-l-2 border-warning text-warning px-4 py-3 rounded-sharp text-sm">
      {message}
    </div>
  )
}
