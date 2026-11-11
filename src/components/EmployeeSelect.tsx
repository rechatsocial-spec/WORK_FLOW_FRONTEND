import { useApi } from '@/lib/hooks';
import { Select } from './ui/primitives';

export default function EmployeeSelect({ value, onChange, allLabel = 'All employees', className, required }: { value: string; onChange: (v: string) => void; allLabel?: string; className?: string; required?: boolean }) {
  const { data } = useApi<any>('/employees', { all: 'true' });
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} className={className} aria-label="Employee" required={required}>
      <option value="">{allLabel}</option>
      {(data?.items ?? []).map((e: any) => (
        <option key={e.id} value={e.id}>
          {e.name} ({e.employeeId}){e.isActive ? '' : ' — inactive'}
        </option>
      ))}
    </Select>
  );
}
