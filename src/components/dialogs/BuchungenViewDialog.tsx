import type { Buchungen, Kurse, Mitglieder } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { IconPencil } from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

interface BuchungenViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Buchungen | null;
  onEdit: (record: Buchungen) => void;
  kurseList: Kurse[];
  mitgliederList: Mitglieder[];
}

export function BuchungenViewDialog({ open, onClose, record, onEdit, kurseList, mitgliederList }: BuchungenViewDialogProps) {
  function getKurseDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return kurseList.find(r => r.record_id === id)?.fields.kursname ?? '—';
  }

  function getMitgliederDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return mitgliederList.find(r => r.record_id === id)?.fields.vorname ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Buchungen anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Kurs</Label>
            <p className="text-sm">{getKurseDisplayName(record.fields.kurs)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Buchungsart</Label>
            <Badge variant="secondary">{record.fields.buchungsart?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Anzahl</Label>
            <p className="text-sm">{record.fields.anzahl ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Buchungsdatum</Label>
            <p className="text-sm">{formatDate(record.fields.buchungsdatum)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Preis (EUR)</Label>
            <p className="text-sm">{record.fields.preis ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Bezahlt</Label>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              record.fields.bezahlt ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {record.fields.bezahlt ? 'Ja' : 'Nein'}
            </span>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Mitglied</Label>
            <p className="text-sm">{getMitgliederDisplayName(record.fields.mitglied)}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}