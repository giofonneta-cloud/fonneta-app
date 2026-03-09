'use client';

import { redirect } from 'next/navigation';

export default function TarifarioPage() {
  redirect('/dashboard/finance');
  return null;
}
