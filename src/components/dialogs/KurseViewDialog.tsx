import type { Kurse } from '@/types/app';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { IconPencil } from '@tabler/icons-react';

interface KurseViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Kurse | null;
  onEdit: (record: Kurse) => void;
}

export function KurseViewDialog({ open, onClose, record, onEdit }: KurseViewDialogProps) {
  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kurse anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Kursname</Label>
            <p className="text-sm">{record.fields.kursname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Einzelpreis (EUR)</Label>
            <p className="text-sm">{record.fields.einzelpreis ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">10er-Karten-Preis (EUR)</Label>
            <p className="text-sm">{record.fields.karten10_preis ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Monatsabo-Preis (EUR)</Label>
            <p className="text-sm">{record.fields.monatsabo_preis ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}