'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { DateField } from '@/components/common/date-field';
import { Spinner } from '@/components/common/loading';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useRecordDeployment } from '@/lib/hooks/use-releases';
import type { PhaseRef } from '@/lib/types';

const STATUSES = [
  { value: 'SUCCEEDED', label: 'Succeeded' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'ROLLED_BACK', label: 'Rolled back' },
];

export function RecordDeploymentDialog({
  open,
  onOpenChange,
  releaseId,
  phases,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  releaseId: string;
  phases: PhaseRef[];
}) {
  const recordDeployment = useRecordDeployment(releaseId);
  const [phaseId, setPhaseId] = useState(phases[0]?.id ?? '');
  const [status, setStatus] = useState('SUCCEEDED');
  const [notes, setNotes] = useState('');
  const [deployedAt, setDeployedAt] = useState<string | null>(new Date().toISOString());

  const phase = phases.find((p) => p.id === phaseId);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await recordDeployment.mutateAsync({
        phaseId,
        status,
        notes: notes || null,
        deployedAt,
      });
      toast.success(`Deployment to ${phase?.name ?? 'the environment'} recorded`, {
        description: 'The project team has been notified.',
      });
      onOpenChange(false);
      setNotes('');
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Could not record that deployment');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record a deployment</DialogTitle>
          <DialogDescription>
            A successful deployment moves every task in this release into that phase.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <Field>
            <FieldLabel>Environment</FieldLabel>
            <Select value={phaseId} onValueChange={setPhaseId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a phase" />
              </SelectTrigger>
              <SelectContent>
                {phases.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                    {item.isProduction ? ' (production)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {phase?.isProduction ? (
              <FieldDescription>
                This marks the release as shipped and sets its release date.
              </FieldDescription>
            ) : null}
          </Field>

          <Field>
            <FieldLabel>Outcome</FieldLabel>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>When</FieldLabel>
            <DateField value={deployedAt} onChange={setDeployedAt} clearable={false} />
          </Field>

          <Field>
            <FieldLabel htmlFor="deploy-notes">Notes</FieldLabel>
            <Textarea
              id="deploy-notes"
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Anything the team should know about this deployment."
            />
          </Field>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="gap-2" disabled={recordDeployment.isPending || !phaseId}>
              {recordDeployment.isPending ? <Spinner /> : null}
              Record deployment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
