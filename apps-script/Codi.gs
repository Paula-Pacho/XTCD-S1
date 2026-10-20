/**
 * Terra, mar i aire digital — servidor (Google Apps Script)
 * Desa les respostes al full de càlcul on està vinculat el script.
 * Instruccions: vegeu README.md
 */

// COM FUNCIONA (visió general)
// Aquest script és el «porter» de la web: s'executa als servidors de Google i es publica com a aplicació web.
//  - doGet(e)  atén les LECTURES (la pàgina demana l'estat, els resultats o el resum).
//  - doPost(e) atén les ESCRIPTURES (un participant respon, la presentadora canvia de pregunta, etc.).
// Tot es desa al full de càlcul on està vinculat el script, en tres pestanyes:
//  - Respostes : una fila per persona (id, nom, centre, data, una columna per resposta i una per comentari).
//  - Estat     : la pregunta activa, si la votació és oberta i si el resum és públic.
//  - Resum     : recomptes per pregunta i opció (fórmules COUNTIF, es calculen soles).
// Les peticions es diferencien pel camp «accio» (en català: respon, comentari, estat, resum, esborra...).
//
// SEGURETAT, en poques paraules:
//  - La CLAU només la comprova el servidor: les accions de la presentadora (canviar pregunta, esborrar, publicar resum,
//    veure noms i comentaris) exigeixen la clau; les dels participants (respondre, comentar) no.
//  - Tot el text rebut es neteja amb net() abans de desar-lo (límit de longitud i protecció contra fórmules de full de càlcul).
//  - És una protecció senzilla pensada per a un joc de classe/formació: no hi guardis dades sensibles.
// CANVIA AQUESTA CLAU abans de publicar. Només la presentadora la coneix.
// La clau de la presentadora. CANVIA-LA a l'editor d'Apps Script abans de la sessió.
// Si publiques aquest fitxer a GitHub, deixa-hi el valor de mostra i posa la clau real només a la còpia d'Apps Script:
// el repositori és públic i qualsevol podria llegir-la.
const CLAU = "canvia-aquesta-clau";

// BANC DE PREGUNTES (només les opcions; el text de la pregunta és a index.html)
// L'ordre importa: la primera llista és la pregunta 1, la segona la 2, etc., i dins de cada una l'ordre de les opcions
// és el mateix que a index.html. El text de cada opció s'ha de copiar EXACTAMENT igual: el servidor valida i compta per coincidència de text.
const QS = [
  ["Primària", "Secundària", "Primària i secundària"],
  ["Aquest és el primer", "2 o 3 anys", "De 4 a 6 anys", "Més de 6 anys"],
  ["No, no sé a quin document et refereixes", "Sí, conec el document. No sé si està vigent.", "Sí, està vigent", "Sí, està vençuda"],
  ["26-27", "27-28", "28-29", "29-30", "No ho sé"],
  ["Sí, i funciona", "Formada, però gairebé no ens trobem", "En procés de formació", "No, encara no s'ha definit", "No, som un claustre molt petit"],
  ["Quinzenal", "Mensual", "Una o dues vegades l'any", "Mai / no tenim comissió"],
  ["Sí, els conec", "Alguna cosa recordo del curs passat", "No els conec"],
  ["Sí", "No", "No ho sé"],
  ["Sí", "Encara no", "No ho sé", "El centre fa servir un domini web propi"],
  ["Coordinació digital", "Equip directiu", "Altra persona o empresa", "No ho sé", "No està definit"],
  ["Sí, actualitzada", "Sí, però és una versió antiga", "No hi és", "No ho sé"],
  ["Sí, hi participem", "Sí, però no hi participem", "N'he sentit parlar", "No el conec"]
];
// Títols curts de cada pregunta. Només s'usen com a capçalera de les columnes del full i a la pestanya Resum.
const TITOLS = [
  "Tipologia del centre", "Anys de coordinació", "EDC vigent?", "Caducitat de l'EDC",
  "Comissió digital formada?", "Freqüència de reunions", "Objectius EDC d'enguany",
  "Objectius EDC a la PGA", "Nodes 2.0", "Qui manté el Nodes",
  "EDC a Documents de centre", "Robots en Acció"
];
// Noms de les pestanyes del full. Si els canvies, canvia'ls abans d'executar configura() i no els reanomenis a mà després.
const FULL_R = "Respostes", FULL_E = "Estat", FULL_S = "Resum";

/** Executa-la una vegada des de l'editor per preparar el full. */
// PREPARACIÓ (s'executa una sola vegada, a mà, des de l'editor d'Apps Script: tria «configura» i prem Executa).
// Crea les pestanyes Respostes, Estat i Resum amb les capçaleres i les fórmules. ATENCIÓ: esborra el contingut anterior,
// per tant, tornar-la a executar buida totes les respostes. Cal fer-ho també si canvies el nombre de preguntes.
function configura() {
  const ss = SpreadsheetApp.getActive();
  let r = ss.getSheetByName(FULL_R) || ss.insertSheet(FULL_R);
  r.clear();
  r.getRange(1, 1, 1, 4 + 2 * QS.length).setValues([["Id", "Nom", "Centre", "Actualitzat"].concat(TITOLS, TITOLS.map(t => "Comentari: " + t))]);
  r.setFrozenRows(1);
  let e = ss.getSheetByName(FULL_E) || ss.insertSheet(FULL_E);
  e.clear();
  e.getRange(1, 1, 4, 2).setValues([["q", 0], ["obert", false], ["actualitzat", new Date()], ["resum_public", false]]);
  let s = ss.getSheetByName(FULL_S) || ss.insertSheet(FULL_S);
  s.clear();
  s.getRange(1, 1, 1, 3).setValues([["Pregunta", "Opció", "Respostes"]]);
  const rows = [];
  QS.forEach((ops, qi) => {
    // Les respostes comencen a la columna 5 (E). La pregunta qi viu a la columna 5+qi; els seus comentaris, 12 columnes més enllà.
    const col = columnLetter(5 + qi);
    ops.forEach((o, i) => rows.push([TITOLS[qi], o, '=COUNTIF(' + FULL_R + '!' + col + ':' + col + ';B' + (rows.length + 2) + ')']));
  });
  s.getRange(2, 1, rows.length, 3).setValues(rows);
  s.setFrozenRows(1);
  const first = ss.getSheetByName("Full 1") || ss.getSheetByName("Hoja 1") || ss.getSheetByName("Sheet1");
  if (first) ss.deleteSheet(first);
}

// Converteix un número de columna en lletra (1→A, 5→E, 27→AA), que és el que necessiten les fórmules del full.
function columnLetter(n) { let s = ""; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }
// Retorna una resposta JSON a la pàgina web.
function json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
// Llegeix la pestanya Estat: quina pregunta és activa (q), si la votació és oberta i si el resum és públic.
function estat() {
  const v = SpreadsheetApp.getActive().getSheetByName(FULL_E).getRange(1, 1, 4, 2).getValues();
  return { q: Number(v[0][1]) || 0, obert: v[1][1] === true || v[1][1] === "TRUE", resum: v[3][1] === true || v[3][1] === "TRUE" };
}
// Neteja un text rebut: elimina espais sobrants, el retalla a n caràcters i, si comença amb = + - o @, hi posa un apòstrof al davant
// perquè el full de càlcul no ho interpreti com una fórmula (evita injecció de fórmules).
function net(t, n) { t = String(t == null ? "" : t).trim().slice(0, n); return /^[=+\-@]/.test(t) ? "'" + t : t; }

// LECTURES. Paràmetre «accio»:
//  - resultats : tot el detall (noms, respostes, comentaris). EXIGEIX la clau.
//  - resum     : només recomptes anònims. Només respon si la presentadora l'ha publicat.
//  - (res)     : només l'estat de la sessió. És el que consulten els participants.
function doGet(e) {
  const p = e.parameter || {};
  if (p.accio === "resultats") {
    if (p.clau !== CLAU) return json({ error: "clau" });
    const sh = SpreadsheetApp.getActive().getSheetByName(FULL_R);
    const n = sh.getLastRow() - 1;
    const rows = n > 0 ? sh.getRange(2, 1, n, 4 + 2 * QS.length).getValues() : [];
    const out = rows.map(r => {
      const a = {};
      QS.forEach((ops, qi) => { const i = ops.indexOf(r[4 + qi]); if (i >= 0) a["q" + qi] = i; });
      const c = {};
      QS.forEach((ops, qi) => { const t = r[4 + QS.length + qi]; if (t) c["q" + qi] = String(t); });
      return { id: r[0], nom: r[1], centre: r[2], actualitzat: String(r[3]), respostes: a, comentaris: c };
    });
    return json({ estat: estat(), persones: out });
  }
  if (p.accio === "resum") {
    // Resum anònim: només recomptes. Sense noms, centres ni comentaris.
    if (!estat().resum) return json({ error: "no_public" });
    const sh = SpreadsheetApp.getActive().getSheetByName(FULL_R);
    const n = sh.getLastRow() - 1;
    const rows = n > 0 ? sh.getRange(2, 5, n, QS.length).getValues() : [];
    const counts = QS.map((ops, qi) => ops.map(o => rows.filter(r => r[qi] === o).length));
    const persones = rows.filter(r => r.some(c => c !== "")).length;
    return json({ counts, persones });
  }
  return json({ estat: estat() });
}

// ESCRIPTURES. El cos de la petició és un JSON amb el camp «accio».
// Accions de PARTICIPANT (sense clau): respon, comentari, identitat.
// Accions de PRESENTADORA (amb clau): estat, resum, esborra.
function doPost(e) {
  let d;
  try { d = JSON.parse(e.postData.contents); } catch (x) { return json({ error: "format" }); }
  // Pany: si diverses persones responen alhora, es posen en cua d'una en una, perquè no es trepitgin les escriptures al full.
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const ss = SpreadsheetApp.getActive();
    // RESPONDRE: només si la votació és oberta, l'opció existeix i la pregunta enviada és l'activa
    // (així una resposta endarrerida d'una pregunta anterior no es compta a la nova).
    if (d.accio === "respon") {
      if (!estat().obert) return json({ error: "tancat" });
      const q = Number(d.q), o = Number(d.opcio);
      if (!(q >= 0 && q < QS.length) || !(o >= 0 && o < QS[q].length)) return json({ error: "dades" });
      if (q !== estat().q) return json({ error: "pregunta" });
      return json({ ok: desa(ss, d, q, QS[q][o]) });
    }
    // COMENTARI: text lliure d'un màxim de 500 caràcters sobre la pregunta activa. Només es llegeix amb la clau.
    if (d.accio === "comentari") {
      const q = Number(d.q);
      if (!(q >= 0 && q < QS.length) || q !== estat().q) return json({ error: "pregunta" });
      return json({ ok: desa(ss, d, q, null, net(d.text, 500)) });
    }
    // IDENTITAT: desa només el nom i el centre (opcionals), sense cap resposta.
    if (d.accio === "identitat") {
      return json({ ok: desa(ss, d, -1, null) });
    }
    // A partir d'aquí, tot el que es faci exigeix la clau de la presentadora.
    if (d.clau !== CLAU) return json({ error: "clau" });
    if (d.accio === "estat") {
      const q = Math.max(0, Math.min(QS.length - 1, Number(d.q) || 0));
      ss.getSheetByName(FULL_E).getRange(1, 2, 3, 1).setValues([[q], [!!d.obert], [new Date()]]);
      return json({ ok: true, estat: estat() });
    }
    if (d.accio === "resum") {
      ss.getSheetByName(FULL_E).getRange(4, 1, 1, 2).setValues([["resum_public", !!d.public]]);
      return json({ ok: true, estat: estat() });
    }
    if (d.accio === "esborra") {
      const sh = ss.getSheetByName(FULL_R);
      if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 4 + 2 * QS.length).clearContent();
      return json({ ok: true });
    }
    return json({ error: "accio" });
  } finally { lock.releaseLock(); }
}

// Desa o actualitza la fila d'una persona (la busca pel seu id aleatori; si no existeix, en crea una de nova).
//  q i etiqueta: pregunta i text de l'opció triada (q=-1 si només es desa nom/centre).
//  com: text del comentari (undefined si no n'hi ha).
function desa(ss, d, q, etiqueta, com) {
  const id = net(d.id, 40);
  if (!id) return false;
  const sh = ss.getSheetByName(FULL_R);
  const trobat = sh.getRange("A:A").createTextFinder(id).matchEntireCell(true).findNext();
  let fila = trobat ? trobat.getRow() : sh.getLastRow() + 1;
  if (!trobat) sh.getRange(fila, 1).setValue(id);
  sh.getRange(fila, 2, 1, 3).setValues([[net(d.nom, 60), net(d.centre, 80), new Date()]]);
  if (q >= 0 && etiqueta != null) sh.getRange(fila, 5 + q).setValue(etiqueta);
  if (q >= 0 && com !== undefined) sh.getRange(fila, 5 + QS.length + q).setValue(com);
  return true;
}
