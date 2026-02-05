"use client";

import { useState, useCallback } from 'react';

export function useDiagramPanZoom() {
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }, [pan.x, pan.y]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging) return;
        setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }, [isDragging, dragStart.x, dragStart.y]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    const reset = useCallback(() => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    }, []);

    const zoomIn = useCallback(() => setZoom(z => Math.min(5, z + 0.1)), []);
    const zoomOut = useCallback(() => setZoom(z => Math.max(0.1, z - 0.1)), []);

    return {
        zoom,
        pan,
        isDragging,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        reset,
        zoomIn,
        zoomOut
    };
}
