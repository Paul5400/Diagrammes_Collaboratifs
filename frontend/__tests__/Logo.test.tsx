import { render } from '@testing-library/react';
import { Logo } from '../src/components/Logo';

describe('Logo', () => {
  it('se rend sans planter', () => {
    render(<Logo />);
  });

  it('se rend avec des propriétés personnalisées', () => {
    render(<Logo size="lg" showText={false} className="test-class" />);
  });
});