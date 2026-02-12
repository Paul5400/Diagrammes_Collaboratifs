import { render, screen } from '@testing-library/react';
import { ProjectCard } from '../src/components/ProjectCard';

describe('ProjectCard', () => {
  it('se rend avec le titre et la date', () => {
    const testProps = {
      id: 'test-diagram',
      title: 'Mon Diagramme Test',
      lastEdited: '2024-01-15'
    };

    render(<ProjectCard {...testProps} />);

    expect(screen.getByText('Mon Diagramme Test')).toBeInTheDocument();
    expect(screen.getByText('2024-01-15')).toBeInTheDocument();
  });

  it('génère le bon lien vers le diagramme', () => {
    const testProps = {
      id: 'diagram-123',
      title: 'Test Diagram',
      lastEdited: '2024-01-01'
    };

    render(<ProjectCard {...testProps} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/diagramme/diagram-123');
  });
});