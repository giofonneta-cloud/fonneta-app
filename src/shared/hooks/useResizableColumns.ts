'use client';

import { useState, useCallback, useRef } from 'react';

export function useResizableColumns(initialWidths: number[]) {
    const [widths, setWidths] = useState<number[]>(initialWidths);
    const widthsRef = useRef(initialWidths);

    const startResize = useCallback((colIndex: number) => (e: React.MouseEvent) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = widthsRef.current[colIndex];

        const onMouseMove = (ev: MouseEvent) => {
            const newWidth = Math.max(60, startWidth + ev.clientX - startX);
            setWidths(prev => {
                const next = [...prev];
                next[colIndex] = newWidth;
                widthsRef.current = next;
                return next;
            });
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, []);

    return { widths, startResize };
}
