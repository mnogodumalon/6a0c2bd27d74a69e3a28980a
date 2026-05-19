import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichBuchungen } from '@/lib/enrich';
import type { EnrichedBuchungen } from '@/types/enriched';
import type { Kurse } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, createRecordUrl } from '@/services/livingAppsService';
import { formatDate, formatCurrency } from '@/lib/formatters';
import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/StatCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { BuchungenDialog } from '@/components/dialogs/BuchungenDialog';
import { KurseDialog } from '@/components/dialogs/KurseDialog';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { IconAlertCircle, IconTool, IconRefresh, IconCheck, IconPlus, IconPencil, IconTrash, IconUsers, IconCurrencyEuro, IconYoga, IconCalendar, IconCreditCard, IconChevronRight } from '@tabler/icons-react';

const APPGROUP_ID = '6a0c2bd27d74a69e3a28980a';
const REPAIR_ENDPOINT = '/claude/build/repair';

export default function DashboardOverview() {
  const {
    mitglieder, kurse, buchungen,
    mitgliederMap, kurseMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const enrichedBuchungen = enrichBuchungen(buchungen, { kurseMap, mitgliederMap });

  const [selectedKurs, setSelectedKurs] = useState<Kurse | null>(null);
  const [buchungDialogOpen, setBuchungDialogOpen] = useState(false);
  const [kursDialogOpen, setKursDialogOpen] = useState(false);
  const [editBuchung, setEditBuchung] = useState<EnrichedBuchungen | null>(null);
  const [editKurs, setEditKurs] = useState<Kurse | null>(null);
  const [deleteBuchungTarget, setDeleteBuchungTarget] = useState<EnrichedBuchungen | null>(null);
  const [deleteKursTarget, setDeleteKursTarget] = useState<Kurse | null>(null);
  const [kursFilter, setKursFilter] = useState('');

  // KPIs
  const totalUmsatz = useMemo(() => buchungen.reduce((s, b) => s + (b.fields.preis ?? 0), 0), [buchungen]);
  const unbezahltCount = useMemo(() => buchungen.filter(b => !b.fields.bezahlt).length, [buchungen]);
  const buchungenThisMonth = useMemo(() => {
    const now = new Date();
    const m = now.getMonth();
    const y = now.getFullYear();
    return buchungen.filter(b => {
      if (!b.fields.buchungsdatum) return false;
      const d = new Date(b.fields.buchungsdatum);
      return d.getMonth() === m && d.getFullYear() === y;
    }).length;
  }, [buchungen]);

  // Filtered kurse
  const filteredKurse = useMemo(() => {
    if (!kursFilter) return kurse;
    const q = kursFilter.toLowerCase();
    return kurse.filter(k => (k.fields.kursname ?? '').toLowerCase().includes(q));
  }, [kurse, kursFilter]);

  // Buchungen for selected kurs
  const kurseBuchungen = useMemo(() => {
    if (!selectedKurs) return enrichedBuchungen;
    return enrichedBuchungen.filter(b => {
      const id = b.fields.kurs ? b.fields.kurs.match(/([a-f0-9]{24})$/i)?.[1] : null;
      return id === selectedKurs.record_id;
    });
  }, [selectedKurs, enrichedBuchungen]);

  const handleDeleteBuchung = async () => {
    if (!deleteBuchungTarget) return;
    await LivingAppsService.deleteBuchungenEntry(deleteBuchungTarget.record_id);
    setDeleteBuchungTarget(null);
    fetchAll();
  };

  const handleDeleteKurs = async () => {
    if (!deleteKursTarget) return;
    await LivingAppsService.deleteKurseEntry(deleteKursTarget.record_id);
    if (selectedKurs?.record_id === deleteKursTarget.record_id) setSelectedKurs(null);
    setDeleteKursTarget(null);
    fetchAll();
  };

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Mitglieder"
          value={String(mitglieder.length)}
          description="Registriert"
          icon={<IconUsers size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Kurse"
          value={String(kurse.length)}
          description="Angeboten"
          icon={<IconYoga size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Buchungen diesen Monat"
          value={String(buchungenThisMonth)}
          description="Aktueller Monat"
          icon={<IconCalendar size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Offene Zahlungen"
          value={String(unbezahltCount)}
          description="Nicht bezahlt"
          icon={<IconCurrencyEuro size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Umsatz Banner */}
      <div className="rounded-2xl bg-primary/5 border border-primary/10 px-5 py-4 flex flex-wrap items-center gap-4 justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Gesamtumsatz</p>
          <p className="text-3xl font-bold text-primary">{formatCurrency(totalUmsatz)}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => { setEditKurs(null); setKursDialogOpen(true); }}>
            <IconPlus size={14} className="mr-1 shrink-0" /><span className="hidden sm:inline">Neuer Kurs</span><span className="sm:hidden">Kurs</span>
          </Button>
          <Button size="sm" onClick={() => { setEditBuchung(null); setBuchungDialogOpen(true); }}>
            <IconPlus size={14} className="mr-1 shrink-0" /><span className="hidden sm:inline">Neue Buchung</span><span className="sm:hidden">Buchung</span>
          </Button>
        </div>
      </div>

      {/* Master-Detail: Kurse + Buchungen */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 items-start">
        {/* Kursliste */}
        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="px-4 pt-4 pb-2 border-b">
            <p className="text-sm font-semibold text-foreground mb-2">Kurse</p>
            <input
              className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Kurs suchen…"
              value={kursFilter}
              onChange={e => setKursFilter(e.target.value)}
            />
          </div>
          <div className="divide-y max-h-[480px] overflow-y-auto">
            <button
              className={`w-full text-left px-4 py-3 flex items-center gap-2 transition-colors hover:bg-muted/50 ${!selectedKurs ? 'bg-primary/5' : ''}`}
              onClick={() => setSelectedKurs(null)}
            >
              <span className={`text-sm font-medium truncate flex-1 min-w-0 ${!selectedKurs ? 'text-primary' : 'text-foreground'}`}>Alle Kurse</span>
              <Badge variant="secondary" className="shrink-0 text-xs">{buchungen.length}</Badge>
              {!selectedKurs && <IconChevronRight size={14} className="shrink-0 text-primary" />}
            </button>
            {filteredKurse.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">Keine Kurse gefunden</div>
            )}
            {filteredKurse.map(kurs => {
              const count = enrichedBuchungen.filter(b => {
                const id = b.fields.kurs ? b.fields.kurs.match(/([a-f0-9]{24})$/i)?.[1] : null;
                return id === kurs.record_id;
              }).length;
              const isSelected = selectedKurs?.record_id === kurs.record_id;
              return (
                <div
                  key={kurs.record_id}
                  className={`flex items-center gap-2 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50 ${isSelected ? 'bg-primary/5' : ''}`}
                  onClick={() => setSelectedKurs(isSelected ? null : kurs)}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>{kurs.fields.kursname ?? '—'}</p>
                    <p className="text-xs text-muted-foreground truncate">{formatCurrency(kurs.fields.einzelpreis)} / Einzel</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-xs">{count}</Badge>
                  <div className="flex gap-1 shrink-0">
                    <button
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      onClick={e => { e.stopPropagation(); setEditKurs(kurs); setKursDialogOpen(true); }}
                      title="Bearbeiten"
                    >
                      <IconPencil size={13} />
                    </button>
                    <button
                      className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      onClick={e => { e.stopPropagation(); setDeleteKursTarget(kurs); }}
                      title="Löschen"
                    >
                      <IconTrash size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Buchungsliste */}
        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b flex items-center justify-between gap-2 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {selectedKurs ? `Buchungen: ${selectedKurs.fields.kursname}` : 'Alle Buchungen'}
              </p>
              <p className="text-xs text-muted-foreground">{kurseBuchungen.length} Einträge</p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setEditBuchung(null);
                setBuchungDialogOpen(true);
              }}
            >
              <IconPlus size={14} className="mr-1 shrink-0" />Buchung
            </Button>
          </div>

          {kurseBuchungen.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <IconCreditCard size={40} className="text-muted-foreground" stroke={1.5} />
              <p className="text-sm text-muted-foreground">Noch keine Buchungen vorhanden</p>
              <Button size="sm" variant="outline" onClick={() => { setEditBuchung(null); setBuchungDialogOpen(true); }}>
                <IconPlus size={14} className="mr-1" />Erste Buchung anlegen
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Mitglied</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden sm:table-cell">Kurs</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Buchungsart</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Datum</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Preis</th>
                    <th className="text-center px-4 py-2.5 text-xs font-medium text-muted-foreground">Bezahlt</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {kurseBuchungen.map(b => (
                    <tr key={b.record_id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-medium text-foreground truncate block max-w-[140px]">{b.mitgliedName || '—'}</span>
                        <span className="text-xs text-muted-foreground sm:hidden truncate block">{b.kursName || '—'}</span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="truncate block max-w-[140px] text-muted-foreground">{b.kursName || '—'}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {b.fields.buchungsart ? (
                          <Badge variant="outline" className="text-xs">{b.fields.buchungsart.label}</Badge>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                        {formatDate(b.fields.buchungsdatum)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {b.fields.preis != null ? formatCurrency(b.fields.preis) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {b.fields.bezahlt ? (
                          <Badge className="bg-green-500/10 text-green-700 border-green-200 text-xs">Ja</Badge>
                        ) : (
                          <Badge className="bg-amber-500/10 text-amber-700 border-amber-200 text-xs">Nein</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-end">
                          <button
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => { setEditBuchung(b); setBuchungDialogOpen(true); }}
                            title="Bearbeiten"
                          >
                            <IconPencil size={14} />
                          </button>
                          <button
                            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            onClick={() => setDeleteBuchungTarget(b)}
                            title="Löschen"
                          >
                            <IconTrash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <BuchungenDialog
        open={buchungDialogOpen}
        onClose={() => { setBuchungDialogOpen(false); setEditBuchung(null); }}
        onSubmit={async (fields) => {
          if (editBuchung) {
            await LivingAppsService.updateBuchungenEntry(editBuchung.record_id, fields);
          } else {
            await LivingAppsService.createBuchungenEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={editBuchung
          ? {
              ...editBuchung.fields,
              kurs: editBuchung.fields.kurs ?? (selectedKurs ? createRecordUrl(APP_IDS.KURSE, selectedKurs.record_id) : undefined),
            }
          : selectedKurs
            ? { kurs: createRecordUrl(APP_IDS.KURSE, selectedKurs.record_id) }
            : undefined
        }
        kurseList={kurse}
        mitgliederList={mitglieder}
        enablePhotoScan={AI_PHOTO_SCAN['Buchungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Buchungen']}
      />

      <KurseDialog
        open={kursDialogOpen}
        onClose={() => { setKursDialogOpen(false); setEditKurs(null); }}
        onSubmit={async (fields) => {
          if (editKurs) {
            await LivingAppsService.updateKurseEntry(editKurs.record_id, fields);
          } else {
            await LivingAppsService.createKurseEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={editKurs?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['Kurse']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Kurse']}
      />

      <ConfirmDialog
        open={!!deleteBuchungTarget}
        title="Buchung löschen"
        description={`Buchung von "${deleteBuchungTarget?.mitgliedName || '—'}" wirklich löschen?`}
        onConfirm={handleDeleteBuchung}
        onClose={() => setDeleteBuchungTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteKursTarget}
        title="Kurs löschen"
        description={`Kurs "${deleteKursTarget?.fields.kursname || '—'}" und alle zugehörigen Daten wirklich löschen?`}
        onConfirm={handleDeleteKurs}
        onClose={() => setDeleteKursTarget(null)}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const [repairing, setRepairing] = useState(false);
  const [repairStatus, setRepairStatus] = useState('');
  const [repairDone, setRepairDone] = useState(false);
  const [repairFailed, setRepairFailed] = useState(false);

  const handleRepair = async () => {
    setRepairing(true);
    setRepairStatus('Reparatur wird gestartet...');
    setRepairFailed(false);

    const errorContext = JSON.stringify({
      type: 'data_loading',
      message: error.message,
      stack: (error.stack ?? '').split('\n').slice(0, 10).join('\n'),
      url: window.location.href,
    });

    try {
      const resp = await fetch(REPAIR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appgroup_id: APPGROUP_ID, error_context: errorContext }),
      });

      if (!resp.ok || !resp.body) {
        setRepairing(false);
        setRepairFailed(true);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data: ')) continue;
          const content = line.slice(6);
          if (content.startsWith('[STATUS]')) {
            setRepairStatus(content.replace(/^\[STATUS]\s*/, ''));
          }
          if (content.startsWith('[DONE]')) {
            setRepairDone(true);
            setRepairing(false);
          }
          if (content.startsWith('[ERROR]') && !content.includes('Dashboard-Links')) {
            setRepairFailed(true);
          }
        }
      }
    } catch {
      setRepairing(false);
      setRepairFailed(true);
    }
  };

  if (repairDone) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <IconCheck size={22} className="text-green-500" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground mb-1">Dashboard repariert</h3>
          <p className="text-sm text-muted-foreground max-w-xs">Das Problem wurde behoben. Bitte laden Sie die Seite neu.</p>
        </div>
        <Button size="sm" onClick={() => window.location.reload()}>
          <IconRefresh size={14} className="mr-1" />Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {repairing ? repairStatus : error.message}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRetry} disabled={repairing}>Erneut versuchen</Button>
        <Button size="sm" onClick={handleRepair} disabled={repairing}>
          {repairing
            ? <span className="inline-block w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-1" />
            : <IconTool size={14} className="mr-1" />}
          {repairing ? 'Reparatur läuft...' : 'Dashboard reparieren'}
        </Button>
      </div>
      {repairFailed && <p className="text-sm text-destructive">Automatische Reparatur fehlgeschlagen. Bitte kontaktieren Sie den Support.</p>}
    </div>
  );
}
