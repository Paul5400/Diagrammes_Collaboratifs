import { DiagramEditor } from '../../../../components/DiagramEditor';

export default async function ViewDiagramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  // L'utilisateur est en mode lecture seule via cette route spécifique
  return (
    <div className="h-screen w-screen overflow-hidden">
      <DiagramEditor 
        id={id} 
        projectName="Diagramme (Lecture Seule)" 
        isReadOnly={true}
      />
    </div>
  );
}
