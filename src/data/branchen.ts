/**
 * Die Branchen, für die eine eigene Seite besteht.
 *
 * Aufbau der Marke
 * ----------------
 * `S&S Leadcraft` ist die branchenoffene Hauptmarke. Darunter liegen
 * Branchenseiten, die denselben Ablauf für ein bestimmtes Gewerk ausgestalten.
 * Die erste — und derzeit einzige — ist `/dachdecker`.
 *
 * Was hier stehen darf
 * --------------------
 * Nur das, was an einer Branche tatsächlich anders ist: wie der Hero spricht,
 * wonach dort gesucht wird, was ausgeschlossen gehört, wo das System anfängt
 * und aufhört, welche Leistungen ein Formular zur Auswahl stellt. Alles, was
 * in jeder Branche gleich ist, steht weiter in `inhalte.ts` und wird nicht
 * je Branche kopiert.
 *
 * Was hier nicht stehen darf
 * --------------------------
 *   - Branchen, für die es keine Seite gibt. Eine Liste geplanter Gewerke
 *     wäre ein Versprechen auf Arbeit, die nicht begonnen ist.
 *   - Zahlen, Volumina, Rankings, Ergebnisse. Die Suchbegriffe hier sind
 *     Beispiele für die Art der Suche, nicht gemessene Werte.
 *   - Exklusivitätszusagen. Exklusivität wird einzeln vereinbart; eine
 *     pauschale Zusage auf einer Branchenseite wäre dieselbe Behauptung, die
 *     auf der Hauptseite bereits entfernt wurde.
 *
 * Eine neue Branche kommt hinzu, wenn es ein Projekt darin gibt — nicht,
 * damit die Übersicht voller aussieht.
 */

export interface Branche {
  /** Schlüssel für Komponenten-Eigenschaften, z. B. `<Hero branche="dachdecker" />` */
  schluessel: string;
  /** Adresse der Branchenseite. Bleibt unverändert, auch wenn die Marke sich ändert. */
  pfad: string;
  /** Die Branche selbst, z. B. „Dachdecker" */
  name: string;
  /** Ein Betrieb dieser Branche, Einzahl */
  betrieb: string;
  /** Betriebe dieser Branche, Mehrzahl */
  betriebe: string;
  /** Nummer in der Übersicht. Reihenfolge des Entstehens, nicht der Wichtigkeit. */
  nr: string;
  /** Ein Satz für die Übersicht. Beschreibt die Branche, nicht den Erfolg. */
  kurz: string;
  seo: {
    /** Ohne Markenname — den hängt das Layout an. Max. 60 Zeichen. */
    titel: string;
    /** Max. 160 Zeichen, sonst schneidet Google ab. */
    beschreibung: string;
  };
  hero: {
    /** Zeilenumbrüche sind gesetzt, nicht dem Zufall überlassen. */
    zeilen: string[];
    vorspann: string;
  };
  /**
   * Begründung des 38°-Winkels.
   *
   * Der Winkel ist auf jeder Seite derselbe; seine Herleitung nicht. Bei den
   * Dachdeckern stammt er erkennbar vom Dach und darf so benannt werden. Auf
   * der branchenoffenen Hauptseite trägt er als Maß, nicht als Erzählung —
   * dort steht deshalb der neutrale Satz aus `Hero.astro`. Eine Branche ohne
   * echte Herleitung lässt dieses Feld `null` und bekommt denselben.
   */
  winkel: string | null;
  /** Ein- und Austritt des Systems, in der Sprache der Branche. */
  system: {
    eingang: string;
    ausgang: string;
  };
  /**
   * Beispiele für Suchverhalten. Keine Volumina, keine Rankings — sie zeigen
   * die Art der Suche, um die es geht, und die Art der Suche, die Geld kostet
   * und keinen Auftrag bringt.
   */
  suche: {
    gesucht: readonly string[];
    ausgeschlossen: readonly string[];
  };
  /**
   * Auswahl im Qualifizierungsformular.
   *
   * Wird heute noch nicht ausgespielt: Das Formular läuft in Phase 4 zweigleisig
   * — eine branchenoffene Liste auf `/kontakt` und der Hauptseite, diese Liste
   * auf der Branchenseite. Bis dahin steht sie hier, damit die Angabe an einer
   * Stelle liegt, wenn es so weit ist.
   */
  leistungen: readonly string[];
  /** Das gebaute Beispielprojekt zu dieser Branche, sofern es eines gibt. */
  beispielprojekt: {
    pfad: string;
    /** Was dort zu sehen ist — ohne zu behaupten, es sei ein Kunde. */
    text: string;
  } | null;
}

export const branchen: readonly Branche[] = [
  {
    schluessel: 'dachdecker',
    pfad: '/dachdecker',
    name: 'Dachdecker',
    betrieb: 'Dachdeckerbetrieb',
    betriebe: 'Dachdeckerbetriebe',
    nr: '01',
    kurz: 'Dachsanierung, Neueindeckung, Flachdach: hohe Auftragswerte, lange Entscheidungswege und ein Markt, in dem Vermittlungsportale dieselbe Anfrage mehrfach verkaufen.',
    seo: {
      titel: 'Kundengewinnung für Dachdeckerbetriebe',
      // 156 Zeichen. Ohne Exklusivitätszusage: Die frühere Fassung versprach
      // „ein Betrieb je Einzugsgebiet" — das ist einzeln vereinbart, nicht
      // allgemein gültig, und gehört deshalb nicht in eine Beschreibung.
      beschreibung:
        'Mehr qualifizierte Anfragen für Dachsanierung, Neueindeckung und Flachdach: Website, Google Ads, Meta Ads und Anfragestrecke als ein System.',
    },
    hero: {
      zeilen: ['Digitale', 'Kundengewinnung', 'für Dachdecker-', 'betriebe.'],
      vorspann:
        'Websites, Kampagnen und eine Anfragestrecke, die auf Dachsanierung, Neueindeckung und Flachdach zugeschnitten sind.',
    },
    winkel: 'Regeldachneigung eines Ziegeldachs. Jeder Winkel dieser Seite folgt ihr.',
    system: {
      eingang: 'Ein Hausbesitzer im Umkreis merkt, dass sein Dach eine Entscheidung verlangt.',
      ausgang: 'Ein Termin auf dem Dach, bei dem beide Seiten wissen, worum es geht.',
    },
    suche: {
      gesucht: ['dachsanierung kosten', 'flachdach abdichten firma', 'dach neu eindecken preis'],
      ausgeschlossen: [
        'dachrinne reinigen',
        'dachdecker ausbildung',
        'dachziegel selber wechseln',
        'dachdecker gehalt',
      ],
    },
    leistungen: [
      'Dachsanierung',
      'Neueindeckung',
      'Flachdach',
      'Energetische Sanierung und Dämmung',
      'Gauben und Dachfenster',
      'PV-Montage oder Vorbereitung',
      'Sonstiges',
    ],
    beispielprojekt: {
      pfad: '/demo',
      text: 'Der vollständige Auftritt eines Dachdeckerbetriebs, gebaut wie für einen Kunden — der Betrieb dahinter ist frei angelegt.',
    },
  },
] as const;

/** Nachschlagen für Komponenten, die eine Branche als Zeichenkette bekommen. */
export function brancheHolen(schluessel: string | undefined): Branche | undefined {
  if (!schluessel) return undefined;
  const treffer = branchen.find((b) => b.schluessel === schluessel);
  if (!treffer) {
    throw new Error(
      `Unbekannte Branche „${schluessel}" — bitte in src/data/branchen.ts eintragen.`,
    );
  }
  return treffer;
}

/** Adresse der Übersicht. Steht hier, damit sie nur an einer Stelle steht. */
export const BRANCHEN_PFAD = '/branchen';
