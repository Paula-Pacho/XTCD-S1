/**
 * Terra, mar i aire digital — servidor (Google Apps Script)
 * Desa les respostes al full de càlcul on està vinculat el script.
 * Instruccions: vegeu README.md
 */

// CANVIA AQUESTA CLAU abans de publicar. Només la presentadora la coneix.
const CLAU = "canvia-aquesta-clau";

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
const TITOLS = [
  "Tipologia del centre", "Anys de coordinació", "EDC vigent?", "Caducitat de l'EDC",
  "Comissió digital formada?", "Freqüència de reunions", "Objectius EDC d'enguany",
  "Objectius EDC a la PGA", "Nodes 2.0", "Qui manté el Nodes",
  "EDC a Documents de centre", "Robots en Acció"
];
const FULL_R = "Respostes", FULL_E = "Estat", FULL_S = "Resum";

/** Executa-la una vegada des de l'editor per preparar el full. */
function configura() {
  const ss = SpreadsheetApp.getActive();
  let r = ss.getSheetByName(FULL_R) || ss.insertSheet(FULL_R);
  r.clear();
  r.getRange(1, 1, 1, 4 + 2 * QS.length).setValues([["Id", "Nom", "Centre", "Actualitzat"].concat(TITOLS, TITOLS.map(t => "Comentari: " + t))]);
  r.setFrozenRows(1);
  let e = ss.getSheetByName(FULL_E) || ss.insertSheet(FULL_E);
  e.clear();
  e.getRange(1, 1, 3, 2).setValues([["q", 0], ["obert", false], ["actualitzat", new Date()]]);
  let s = ss.getSheetByName(FULL_S) || ss.insertSheet(FULL_S);
  s.clear();
  s.getRange(1, 1, 1, 3).setValues([["Pregunta", "Opció", "Respostes"]]);
  const rows = [];
  QS.forEach((ops, qi) => {
    const col = columnLetter(5 + qi);
    ops.forEach((o, i) => rows.push([TITOLS[qi], o, '=COUNTIF(' + FULL_R + '!' + col + ':' + col + ';B' + (rows.length + 2) + ')']));
  });
  s.getRange(2, 1, rows.length, 3).setValues(rows);
  s.setFrozenRows(1);
  const first = ss.getSheetByName("Full 1") || ss.getSheetByName("Hoja 1") || ss.getSheetByName("Sheet1");
  if (first) ss.deleteSheet(first);
}

function columnLetter(n) { let s = ""; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }
function json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function estat() {
  const v = SpreadsheetApp.getActive().getSheetByName(FULL_E).getRange(1, 1, 2, 2).getValues();
  return { q: Number(v[0][1]) || 0, obert: v[1][1] === true || v[1][1] === "TRUE" };
}
function net(t, n) { t = String(t == null ? "" : t).trim().slice(0, n); return /^[=+\-@]/.test(t) ? "'" + t : t; }

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
  return json({ estat: estat() });
}

function doPost(e) {
  let d;
  try { d = JSON.parse(e.postData.contents); } catch (x) { return json({ error: "format" }); }
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const ss = SpreadsheetApp.getActive();
    if (d.accio === "respon") {
      if (!estat().obert) return json({ error: "tancat" });
      const q = Number(d.q), o = Number(d.opcio);
      if (!(q >= 0 && q < QS.length) || !(o >= 0 && o < QS[q].length)) return json({ error: "dades" });
      if (q !== estat().q) return json({ error: "pregunta" });
      return json({ ok: desa(ss, d, q, QS[q][o]) });
    }
    if (d.accio === "comentari") {
      const q = Number(d.q);
      if (!(q >= 0 && q < QS.length) || q !== estat().q) return json({ error: "pregunta" });
      return json({ ok: desa(ss, d, q, null, net(d.text, 500)) });
    }
    if (d.accio === "identitat") {
      return json({ ok: desa(ss, d, -1, null) });
    }
    if (d.clau !== CLAU) return json({ error: "clau" });
    if (d.accio === "estat") {
      const q = Math.max(0, Math.min(QS.length - 1, Number(d.q) || 0));
      ss.getSheetByName(FULL_E).getRange(1, 2, 3, 1).setValues([[q], [!!d.obert], [new Date()]]);
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
