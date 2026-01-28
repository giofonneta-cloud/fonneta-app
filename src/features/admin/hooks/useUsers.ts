// Hook para gestión de usuarios

import { useState, useEffect, useCallback } from 'react';
import {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    toggleUserActive,
    resetUserPassword,
    getUserStats,
} from '../services/userService';
import type {
    ExtendedProfile,
    UserListParams,
    UserListResult,
    CreateUserInput,
    UpdateUserInput,
    UserStats,
} from '../services/userService';

interface UseUsersResult {
    users: ExtendedProfile[];
    total: number;
    page: number;
    totalPages: number;
    isLoading: boolean;
    error: string | null;
    stats: UserStats | null;
    // Acciones
    fetchUsers: (params?: UserListParams) => Promise<void>;
    fetchUser: (id: string) => Promise<ExtendedProfile | null>;
    addUser: (input: CreateUserInput) => Promise<{ success: boolean; error?: string }>;
    editUser: (id: string, input: UpdateUserInput) => Promise<{ success: boolean; error?: string }>;
    toggleActive: (id: string, isActive: boolean) => Promise<{ success: boolean; error?: string }>;
    sendPasswordReset: (id: string) => Promise<{ success: boolean; error?: string }>;
    refresh: () => Promise<void>;
}

export function useUsers(initialParams?: UserListParams): UseUsersResult {
    const [result, setResult] = useState<UserListResult>({
        users: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [currentParams, setCurrentParams] = useState<UserListParams>(initialParams ?? {});

    const fetchUsers = useCallback(async (params?: UserListParams) => {
        setIsLoading(true);
        setError(null);

        const newParams = params ?? currentParams;
        setCurrentParams(newParams);

        try {
            const data = await getUsers(newParams);
            setResult(data);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Error al cargar usuarios');
        } finally {
            setIsLoading(false);
        }
    }, [currentParams]);

    const fetchUser = useCallback(async (id: string) => {
        return getUserById(id);
    }, []);

    const addUser = useCallback(async (input: CreateUserInput) => {
        const result = await createUser(input);
        if (result.success) {
            await fetchUsers();
        }
        return result;
    }, [fetchUsers]);

    const editUser = useCallback(async (id: string, input: UpdateUserInput) => {
        const result = await updateUser(id, input);
        if (result.success) {
            await fetchUsers();
        }
        return result;
    }, [fetchUsers]);

    const toggleActive = useCallback(async (id: string, isActive: boolean) => {
        const result = await toggleUserActive(id, isActive);
        if (result.success) {
            await fetchUsers();
        }
        return result;
    }, [fetchUsers]);

    const sendPasswordReset = useCallback(async (id: string) => {
        return resetUserPassword(id);
    }, []);

    const refresh = useCallback(async () => {
        await Promise.all([
            fetchUsers(),
            getUserStats().then(setStats),
        ]);
    }, [fetchUsers]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return {
        users: result.users,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        isLoading,
        error,
        stats,
        fetchUsers,
        fetchUser,
        addUser,
        editUser,
        toggleActive,
        sendPasswordReset,
        refresh,
    };
}
