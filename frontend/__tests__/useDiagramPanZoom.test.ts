import { renderHook, act } from '@testing-library/react';
import { useDiagramPanZoom } from '../src/hooks/useDiagramPanZoom';

describe('useDiagramPanZoom', () => {
    it('doit initialiser avec des valeurs par défaut', () => {
        const { result } = renderHook(() => useDiagramPanZoom());

        expect(result.current.zoom).toBe(1);
        expect(result.current.pan).toEqual({ x: 0, y: 0 });
        expect(result.current.isDragging).toBe(false);
    });

    it('doit augmenter le zoom avec zoomIn', () => {
        const { result } = renderHook(() => useDiagramPanZoom());

        act(() => {
            result.current.zoomIn();
        });

        expect(result.current.zoom).toBe(1.1);
    });

    it('doit diminuer le zoom avec zoomOut', () => {
        const { result } = renderHook(() => useDiagramPanZoom());

        act(() => {
            result.current.zoomOut();
        });

        expect(result.current.zoom).toBe(0.9);
    });

    it('doit limiter le zoom minimum à 0.1', () => {
        const { result } = renderHook(() => useDiagramPanZoom());

        act(() => {
            // Zoom out 20 fois pour aller sous 0.1
            for (let i = 0; i < 20; i++) {
                result.current.zoomOut();
            }
        });

        expect(result.current.zoom).toBeGreaterThanOrEqual(0.1);
    });

    it('doit limiter le zoom maximum à 5', () => {
        const { result } = renderHook(() => useDiagramPanZoom());

        act(() => {
            // Zoom in 50 fois pour aller au-dessus de 5
            for (let i = 0; i < 50; i++) {
                result.current.zoomIn();
            }
        });

        expect(result.current.zoom).toBeLessThanOrEqual(5);
    });

    it('doit réinitialiser le zoom et le pan avec reset', () => {
        const { result } = renderHook(() => useDiagramPanZoom());

        act(() => {
            result.current.zoomIn();
            result.current.zoomIn();
        });

        expect(result.current.zoom).not.toBe(1);

        act(() => {
            result.current.reset();
        });

        expect(result.current.zoom).toBe(1);
        expect(result.current.pan).toEqual({ x: 0, y: 0 });
    });

    it('doit activer isDragging avec handleMouseDown', () => {
        const { result } = renderHook(() => useDiagramPanZoom());

        const mockEvent = {
            clientX: 100,
            clientY: 100,
        } as React.MouseEvent;

        act(() => {
            result.current.handleMouseDown(mockEvent);
        });

        expect(result.current.isDragging).toBe(true);
    });

    it('doit désactiver isDragging avec handleMouseUp', () => {
        const { result } = renderHook(() => useDiagramPanZoom());

        const mockEvent = {
            clientX: 100,
            clientY: 100,
        } as React.MouseEvent;

        act(() => {
            result.current.handleMouseDown(mockEvent);
        });

        expect(result.current.isDragging).toBe(true);

        act(() => {
            result.current.handleMouseUp();
        });

        expect(result.current.isDragging).toBe(false);
    });
});
