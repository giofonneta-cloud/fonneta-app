'use client';

import type { AdminAlert } from '../types/admin.types';
import Link from 'next/link';

interface Props {
    alerts: AdminAlert[];
}

export function AlertsCard({ alerts }: Props) {
    if (alerts.length === 0) return null;

    const getAlertStyles = (type: AdminAlert['type']) => {
        switch (type) {
            case 'error':
                return 'bg-red-50 border-red-200 text-red-800';
            case 'warning':
                return 'bg-amber-50 border-amber-200 text-amber-800';
            case 'info':
            default:
                return 'bg-blue-50 border-blue-200 text-blue-800';
        }
    };

    const getIcon = (type: AdminAlert['type']) => {
        switch (type) {
            case 'error':
                return (
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                );
            case 'warning':
                return (
                    <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                );
            case 'info':
            default:
                return (
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                );
        }
    };

    return (
        <div className="space-y-3">
            {alerts.map((alert) => (
                <div
                    key={alert.id}
                    className={`rounded-lg border p-4 ${getAlertStyles(alert.type)}`}
                >
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                            {getIcon(alert.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-4">
                                <h4 className="font-medium">
                                    {alert.title}
                                    {alert.count !== undefined && (
                                        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-white/50">
                                            {alert.count}
                                        </span>
                                    )}
                                </h4>
                                {alert.link && (
                                    <Link
                                        href={alert.link}
                                        className="text-sm font-medium underline underline-offset-2 hover:no-underline flex-shrink-0"
                                    >
                                        Ver más →
                                    </Link>
                                )}
                            </div>
                            <p className="text-sm mt-1 opacity-80">
                                {alert.description}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
