'use client';

import type { SystemStats } from '../types/admin.types';

interface Props {
    stats: SystemStats;
}

export function SystemHealthCard({ stats }: Props) {
    const healthScore = calculateHealthScore(stats);

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                    Salud del Sistema
                </h3>
                <HealthBadge score={healthScore} />
            </div>

            <div className="space-y-4">
                <MetricRow
                    label="Usuarios activos"
                    value={stats.activeUsers}
                    total={stats.totalUsers}
                    threshold={0.7}
                />
                <MetricRow
                    label="Proyectos en curso"
                    value={stats.activeProjects}
                    total={stats.totalProjects}
                    threshold={0.5}
                />
                <MetricRow
                    label="Proveedores aprobados"
                    value={stats.activeProviders}
                    total={stats.totalProviders}
                    threshold={0.6}
                />
                <MetricRow
                    label="Documentos vigentes"
                    value={stats.totalProviders - stats.expiringDocuments}
                    total={stats.totalProviders}
                    threshold={0.9}
                    inverse
                />
            </div>

            {/* Alertas de atención */}
            {(stats.inactiveUsersCount > 0 || stats.expiringDocuments > 0) && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-700 mb-3">Requiere atención:</p>
                    <div className="space-y-2">
                        {stats.inactiveUsersCount > 0 && (
                            <AlertItem
                                text={`${stats.inactiveUsersCount} usuarios inactivos`}
                                type="warning"
                            />
                        )}
                        {stats.expiringDocuments > 0 && (
                            <AlertItem
                                text={`${stats.expiringDocuments} documentos por vencer`}
                                type="warning"
                            />
                        )}
                        {stats.pendingInvoices > 0 && (
                            <AlertItem
                                text={`${stats.pendingInvoices} facturas pendientes`}
                                type="info"
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function calculateHealthScore(stats: SystemStats): number {
    let score = 100;

    // Penalizar por usuarios inactivos
    if (stats.totalUsers > 0) {
        const inactiveRatio = stats.inactiveUsersCount / stats.totalUsers;
        score -= inactiveRatio * 20;
    }

    // Penalizar por documentos por vencer
    if (stats.totalProviders > 0) {
        const expiringRatio = stats.expiringDocuments / stats.totalProviders;
        score -= expiringRatio * 30;
    }

    // Penalizar por facturas pendientes
    score -= Math.min(stats.pendingInvoices * 2, 20);

    return Math.max(0, Math.round(score));
}

interface HealthBadgeProps {
    score: number;
}

function HealthBadge({ score }: HealthBadgeProps) {
    const getColor = () => {
        if (score >= 80) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        if (score >= 60) return 'bg-amber-100 text-amber-700 border-amber-200';
        return 'bg-red-100 text-red-700 border-red-200';
    };

    const getLabel = () => {
        if (score >= 80) return 'Excelente';
        if (score >= 60) return 'Regular';
        return 'Atención';
    };

    return (
        <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getColor()}`}>
            {getLabel()} ({score}%)
        </div>
    );
}

interface MetricRowProps {
    label: string;
    value: number;
    total: number;
    threshold: number;
    inverse?: boolean;
}

function MetricRow({ label, value, total, threshold, inverse }: MetricRowProps) {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    const isHealthy = inverse ? percentage <= threshold * 100 : percentage >= threshold * 100;

    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">{label}</span>
                <span className="font-medium text-gray-900">
                    {value}/{total}
                </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all ${isHealthy ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />
            </div>
        </div>
    );
}

interface AlertItemProps {
    text: string;
    type: 'warning' | 'info' | 'error';
}

function AlertItem({ text, type }: AlertItemProps) {
    const colors = {
        warning: 'text-amber-600 bg-amber-50',
        info: 'text-blue-600 bg-blue-50',
        error: 'text-red-600 bg-red-50',
    };

    return (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${colors[type]}`}>
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{text}</span>
        </div>
    );
}
