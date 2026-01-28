'use server';

import { createClient } from '@/lib/supabase/server';
import { Project } from '@/features/projects/types/project.types';
import { revalidatePath } from 'next/cache';

export async function createProjectAction(project: any) {
    console.log("SERVER ACTION: Creating project...", project);
    const supabase = await createClient(); // Await because createClient is async in server.ts

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'No autenticado' };
    }

    // Secure Payload Construction Server-Side
    const payload = {
        name: project.name,
        client: project.client,
        status: project.status || 'brief',
        // pm_id or user_id? We saw pm_id exists.
        // Let's rely on what we learned: pm_id exists.
        pm_id: user.id,
        start_date: project.start_date,
        budget_income: project.budget_income,
        budget_expense: project.budget_expense,
        budget_income_currency: project.budget_income_currency || 'COP',
        budget_expense_currency: project.budget_expense_currency || 'COP'
    };

    console.log("SERVER ACTION: Payload", payload);

    const { data, error } = await supabase
        .from('projects')
        .insert(payload)
        .select()
        .single();

    if (error) {
        console.error("SERVER ACTION ERROR:", error);
        return { error: error.message, details: error };
    }

    revalidatePath('/dashboard/projects');
    return { data };
}
