export default async function DiagramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Diagramme {id}</h1>
      <p>Zone d'édition du diagramme.</p>
    </div>
  );
}
