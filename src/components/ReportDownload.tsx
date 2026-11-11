import { FileSpreadsheet, FileText } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { downloadFile, errMsg } from '@/lib/api';
import { monthKey } from '@/lib/utils';
import { Button, Input } from './ui/primitives';

/** month picker + PDF/Excel buttons. Pass employeeId (admin) or leave undefined for "my report". */
export default function ReportDownload({ employeeId, url = '/reports/monthly', extra }: { employeeId?: string; url?: string; extra?: Record<string, unknown> }) {
  const [month, setMonth] = useState(monthKey());
  const [busy, setBusy] = useState('');

  async function go(format: 'pdf' | 'xlsx') {
    setBusy(format);
    try {
      await downloadFile(url, { month, format, employeeId, ...extra }, `report-${month}.${format}`);
      toast.success(`${format.toUpperCase()} downloaded`);
    } catch (e) {
      // blob error bodies need decoding
      const msg = (e as any)?.response?.data instanceof Blob ? JSON.parse(await (e as any).response.data.text()).message : errMsg(e);
      toast.error(msg);
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input type="month" value={month} max={monthKey()} onChange={(e) => e.target.value && setMonth(e.target.value)} className="h-10 w-44" aria-label="Report month" />
      <Button variant="outline" loading={busy === 'pdf'} onClick={() => go('pdf')}>
        <FileText className="h-4 w-4" /> PDF
      </Button>
      <Button variant="outline" loading={busy === 'xlsx'} onClick={() => go('xlsx')}>
        <FileSpreadsheet className="h-4 w-4" /> Excel
      </Button>
    </div>
  );
}
