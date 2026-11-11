import { useState } from 'react';
import EmployeeSelect from '@/components/EmployeeSelect';
import ReportDownload from '@/components/ReportDownload';
import { PageHeader } from '@/components/ui/data';
import { Card, CardContent, CardHeader, CardTitle, Field, Select } from '@/components/ui/primitives';
import { useApi } from '@/lib/hooks';

export default function AdminReports() {
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('');
  const depts = useApi<any>('/employees/meta/departments');

  return (
    <div>
      <PageHeader title="Reports" description="Download monthly timesheets as PDF or Excel." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Individual employee report</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Daily start/end, working & break hours, updates submitted, tasks and attendance status for one employee.</p>
            <Field label="Employee"><EmployeeSelect value={employeeId} onChange={setEmployeeId} allLabel="Select employee…" /></Field>
            {employeeId ? <ReportDownload employeeId={employeeId} /> : <p className="text-sm text-muted-foreground">Choose an employee to enable downloads.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Consolidated report — all employees</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">One summary row per employee plus (in Excel) a full daily-detail sheet.</p>
            <Field label="Department (optional)">
              <Select value={department} onChange={(e) => setDepartment(e.target.value)}>
                <option value="">All departments</option>
                {(depts.data?.departments ?? []).map((d: string) => <option key={d}>{d}</option>)}
              </Select>
            </Field>
            <ReportDownload url="/reports/consolidated" extra={{ department }} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
