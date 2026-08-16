export function EmptyState({ message }: { message: string }) {
  return (
    <div className="border border-dashed border-line rounded-sharp py-12 px-6 text-center text-text-gray-light">
      {message}
    </div>
  )
}
