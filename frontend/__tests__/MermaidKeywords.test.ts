import { MERMAID_KEYWORDS } from '../src/config/MermaidKeywords';

describe('MERMAID_KEYWORDS', () => {
    it('doit être un tableau', () => {
        expect(Array.isArray(MERMAID_KEYWORDS)).toBe(true);
    });

    it('doit contenir des mots-clés de types de diagrammes', () => {
        const diagramTypes = [
            'sequenceDiagram',
            'flowchart',
            'classDiagram',
            'stateDiagram-v2',
            'gantt',
            'pie',
            'erDiagram',
        ];

        diagramTypes.forEach((type) => {
            expect(MERMAID_KEYWORDS).toContain(type);
        });
    });

    it('doit contenir des mots-clés de séquence', () => {
        const sequenceKeywords = ['participant', 'actor', 'loop', 'alt', 'opt'];

        sequenceKeywords.forEach((keyword) => {
            expect(MERMAID_KEYWORDS).toContain(keyword);
        });
    });

    it('doit contenir des mots-clés de direction', () => {
        const directions = ['LR', 'TB', 'BT', 'RL'];

        directions.forEach((direction) => {
            expect(MERMAID_KEYWORDS).toContain(direction);
        });
    });



    it('doit contenir au moins 30 mots-clés', () => {
        expect(MERMAID_KEYWORDS.length).toBeGreaterThanOrEqual(30);
    });

    it('tous les mots-clés doivent être des chaînes non vides', () => {
        MERMAID_KEYWORDS.forEach((keyword) => {
            expect(typeof keyword).toBe('string');
            expect(keyword.length).toBeGreaterThan(0);
        });
    });
});
