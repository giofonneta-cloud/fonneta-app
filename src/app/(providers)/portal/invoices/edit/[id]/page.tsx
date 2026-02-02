import { ProviderInvoiceEditForm } from '@/features/providers/components/ProviderInvoiceEditForm';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function EditInvoicePage({ params }: Props) {
    const { id } = await params;
    return <ProviderInvoiceEditForm invoiceId={id} />;
}
