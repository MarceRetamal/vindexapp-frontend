export function Pendiente({ titulo }: { titulo: string }) {
  return (
    <div>
      <h1 style={{ fontSize: 26, marginBottom: 8 }}>{titulo}</h1>
      <p style={{ color: 'var(--tinta-suave)' }}>Esta sección todavía no está construida.</p>
    </div>
  );
}
