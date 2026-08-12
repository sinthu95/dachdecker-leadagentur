/** Der Weg nach einer serverseitigen Ablehnung: bleiben die Eingaben stehen? */
import puppeteer from 'puppeteer-core';
const basis = process.argv[2] ?? 'http://127.0.0.1:4321';
const b = await puppeteer.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox','--disable-gpu','--hide-scrollbars']});
const p = await b.newPage();
await p.setViewport({width:1440,height:900});
const befunde=[];
const ok=t=>console.log('  ok    '+t); const bad=t=>{befunde.push(t);console.log('  FEHLT '+t);};

await p.goto(basis+'/kontakt',{waitUntil:'networkidle0'});
// Vollständig ausfüllen, aber die Einwilligung bewusst weglassen ⇒ Server lehnt ab.
await p.evaluate(()=>{
  const f=document.querySelector('[data-anfrage]');
  f.betrieb.value='Dachdeckerei Beispiel'; f.ort.value='45549'; f.website.value='beispiel.de';
  f.querySelector('#mitarbeiter').value='5–9';
  f.querySelectorAll('input[name="leistungen"]')[1].checked=true;
  f.querySelectorAll('input[name="kapazitaet"]')[2].checked=true;
  f.querySelector('#herkunft').value='Empfehlung';
  f.querySelectorAll('input[name="werbung"]')[0].checked=true;
  f.name.value='Max Beispiel'; f.telefon.value='0201 1234567'; f.email.value='max@beispiel.de';
  f.querySelectorAll('input[name="erreichbar"]')[2].checked=true;
  f.nachricht.value='Wir wollen mehr Flachdach.';
  // Zeitfalle umgehen
  f.querySelector('[data-geladen]').value=String(Date.now()-9000);
  // Einwilligung entfernen und required lösen, damit der Server entscheidet
  const e=f.querySelector('input[name="einwilligung"]'); e.checked=false; e.required=false;
  f.querySelectorAll('[data-schritt]').forEach(s=>s.hidden=false);
});
await Promise.all([p.waitForNavigation({waitUntil:'networkidle0'}), p.evaluate(()=>document.querySelector('[data-senden]').click())]);
const url = p.url();
if (url.includes('fehler=pflichtfelder')) ok('Server lehnt ohne Einwilligung ab → '+url.replace(basis,''));
else bad('unerwartetes Ziel: '+url);

await new Promise(r=>setTimeout(r,500));
const sichtbar = await p.evaluate(()=>({
  banner: !document.getElementById('formularfehler').hidden,
  text: document.getElementById('formularfehler-text').textContent.slice(0,60),
}));
if (sichtbar.banner) ok('Fehlerhinweis wird eingeblendet: „'+sichtbar.text+'…"');
else bad('Fehlerhinweis bleibt versteckt');

const wieder = await p.evaluate(()=>{
  const f=document.querySelector('[data-anfrage]');
  return {betrieb:f.betrieb.value, ort:f.ort.value, name:f.name.value, telefon:f.telefon.value,
    email:f.email.value, mitarbeiter:f.querySelector('#mitarbeiter').value,
    leistungen:[...f.querySelectorAll('input[name="leistungen"]:checked')].map(i=>i.value),
    kapazitaet:[...f.querySelectorAll('input[name="kapazitaet"]:checked')].map(i=>i.value),
    werbung:[...f.querySelectorAll('input[name="werbung"]:checked')].map(i=>i.value),
    erreichbar:[...f.querySelectorAll('input[name="erreichbar"]:checked')].map(i=>i.value),
    nachricht:f.nachricht.value, einwilligung:f.querySelector('input[name="einwilligung"]').checked,
    honigtopf:f.querySelector('#firmenzusatz').value};
});
const soll={betrieb:'Dachdeckerei Beispiel',ort:'45549',name:'Max Beispiel',telefon:'0201 1234567',email:'max@beispiel.de',mitarbeiter:'5–9',nachricht:'Wir wollen mehr Flachdach.'};
for (const [k,v] of Object.entries(soll)) wieder[k]===v ? ok(`„${k}" steht wieder da`) : bad(`„${k}": „${wieder[k]}" statt „${v}"`);
wieder.leistungen.length===1 ? ok('Leistungsauswahl wiederhergestellt: '+wieder.leistungen[0]) : bad('Leistungsauswahl verloren');
wieder.kapazitaet.length===1 ? ok('Kapazität wiederhergestellt: '+wieder.kapazitaet[0]) : bad('Kapazität verloren');
wieder.werbung.length===1 ? ok('Werbung wiederhergestellt') : bad('Werbung verloren');
wieder.erreichbar.length===1 ? ok('Erreichbarkeit wiederhergestellt') : bad('Erreichbarkeit verloren');
wieder.einwilligung===false ? ok('Einwilligung wird bewusst NICHT wiederhergestellt') : bad('Einwilligung wurde wiederhergestellt — die muss aktiv gesetzt werden');
wieder.honigtopf==='' ? ok('Honigtopf bleibt leer') : bad('Honigtopf gefüllt');

// Zweiter Aufruf ohne Fehler: Entwurf darf nicht erneut greifen
await p.goto(basis+'/kontakt',{waitUntil:'networkidle0'});
const leer = await p.evaluate(()=>document.querySelector('[data-anfrage]').betrieb.value);
leer==='' ? ok('ohne Fehlerparameter bleibt das Formular leer') : bad('Entwurf wird ungefragt eingesetzt: '+leer);

await b.close();
console.log(`\n${befunde.length} Befunde`);
process.exit(befunde.length?1:0);
