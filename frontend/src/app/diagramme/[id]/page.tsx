import { DiagramEditor } from '../../../components/DiagramEditor';

export default async function DiagramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  return (
    <div className="h-screen w-screen overflow-hidden">
      <DiagramEditor id={id} />
    </div>
  );
}
