'use client';

import { useState, useEffect } from 'react';
import { parametrosService } from '@/features/admin/services/parametrosService';
import type { Parametro } from '@/features/admin/types/admin.types';

export function useParametros(categoria: string) {
    const [opciones, setOpciones] = useState<Parametro[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        parametrosService
            .getByCategoria(categoria)
            .then(setOpciones)
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [categoria]);

    return { opciones, isLoading };
}
