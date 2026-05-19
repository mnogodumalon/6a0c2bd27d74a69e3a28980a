// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface Mitglieder {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    vorname?: string;
    nachname?: string;
    email?: string;
    telefon?: string;
  };
}

export interface Kurse {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    kursname?: string;
    einzelpreis?: number;
    karten10_preis?: number;
    monatsabo_preis?: number;
  };
}

export interface Buchungen {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    kurs?: string; // applookup -> URL zu 'Kurse' Record
    buchungsart?: LookupValue;
    anzahl?: number;
    buchungsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    preis?: number;
    bezahlt?: boolean;
    mitglied?: string; // applookup -> URL zu 'Mitglieder' Record
  };
}

export const APP_IDS = {
  MITGLIEDER: '6a0c2bb73be88fb13d6da8f8',
  KURSE: '6a0c2bba5a97c0d9a76d187f',
  BUCHUNGEN: '6a0c2bbaf17fab41001998d6',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'buchungen': {
    buchungsart: [{ key: "einzel", label: "Einzelbuchung" }, { key: "karte_10", label: "10er-Karte" }, { key: "abo_monat", label: "Monatsabo" }, { key: "abo_jahr", label: "Jahresabo" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'mitglieder': {
    'vorname': 'string/text',
    'nachname': 'string/text',
    'email': 'string/email',
    'telefon': 'string/tel',
  },
  'kurse': {
    'kursname': 'string/text',
    'einzelpreis': 'number',
    'karten10_preis': 'number',
    'monatsabo_preis': 'number',
  },
  'buchungen': {
    'kurs': 'applookup/select',
    'buchungsart': 'lookup/radio',
    'anzahl': 'number',
    'buchungsdatum': 'date/date',
    'preis': 'number',
    'bezahlt': 'bool',
    'mitglied': 'applookup/select',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateMitglieder = StripLookup<Mitglieder['fields']>;
export type CreateKurse = StripLookup<Kurse['fields']>;
export type CreateBuchungen = StripLookup<Buchungen['fields']>;