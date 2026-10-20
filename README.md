# Terra, mar i aire digital

Versió virtual del joc de posicionament «Terra, mar i aire» (inspirat en el recurs de Fundesplai:
https://fundesplai.org/banc-recursos/recurs/terra-mar-i-aire/) per conèixer els coordinadors i coordinadores
digitals de la Xarxa Territorial de Cultura Digital (xTCD) de l'Alt Penedès i saber en quin punt és cada centre.

- Es projecta una pregunta amb opcions; cada opció és una «franja» de color.
- Cada participant tria la seva franja des del mòbil o l'ordinador, **sense compte ni registre**. Nom i centre són opcionals.
- La vista de projecció mostra en directe el recompte i el percentatge de cada franja.
- Les respostes queden en un **full de càlcul de Google** (pestanyes `Respostes` i `Resum`) i també es poden descarregar en CSV.

## Contingut
- `index.html`: la pàgina (un sol fitxer, sense dependències).
- `apps-script/Codi.gs`: el servidor (Google Apps Script) que desa les respostes al full de càlcul.
- `preguntes.md`: les 12 preguntes i opcions.

## Posada en marxa (una sola vegada, uns 10 minuts)
1. **Full de càlcul:** crea un full nou a Google Drive (per exemple «xTCD respostes»).
2. **Script:** al full, `Extensions > Apps Script`. Esborra el que hi ha i enganxa el contingut de `apps-script/Codi.gs`.
3. **Clau:** a dalt de tot del codi, canvia el valor de `CLAU` per una clau teva (només la presentadora la coneixerà).
4. **Prepara el full:** al desplegable de funcions tria `configura` i prem *Executa*. Accepta els permisos. Crea les pestanyes `Respostes`, `Estat` i `Resum`.
5. **Publica:** `Desplega > Nou desplegament > Aplicació web`. *Executa com:* **jo**. *Qui hi té accés:* **Qualsevol persona**. Copia l'URL que acaba en `/exec`.
6. **Connecta la pàgina:** a `index.html`, substitueix `PASTE_URL_AQUI` per aquest URL.
7. **Publica a GitHub Pages:** `Settings > Pages > Deploy from a branch > main / (root)`.

Si canvies el codi del script, cal fer `Desplega > Gestiona els desplegaments > Edita > Nova versió` perquè s'apliquin els canvis.

## Ús a la sessió
- **Presentadora:** obre `https://<usuari>.github.io/<repositori>/#presenta`, escriu la clau i projecta la pantalla. Amb els botons obre i tanca la votació i canvia de pregunta.
- **Participants:** obren `https://<usuari>.github.io/<repositori>/` i trien la seva franja.

## Notes
- Si l'administració del compte de Google (per exemple el d'Educació) no et deixa triar «Qualsevol persona», fes el desplegament amb un compte de Google personal.
- La pantalla s'actualitza cada 2,5 segons.
- Si canvies les preguntes, fes-ho **en els dos llocs**: la llista `QS` d'`index.html` i les llistes `QS` i `TITOLS` de `Codi.gs`, i torna a executar `configura` (esborra les respostes).
- La clau viu només al servidor; el codi de la pàgina no la conté. Tot i així, és una protecció senzilla: no hi guardis dades sensibles.
- Dades personals: si els participants posen nom i centre, informa'ls de per a què es fan servir. Recomano esborrar el full quan acabi el curs.

## Autoria
Paula Pacho, Mentoria 4.0 de l'Alt Penedès. Pàgina generada amb Claude.

---

# Guia per a docents: entendre-ho i adaptar-ho

Aquesta part és per a qui vulgui agafar la proposta, entendre com està feta i personalitzar-la per a la seva aula, claustre o formació.
El codi està comentat en català, fitxer per fitxer, perquè es pugui llegir com un petit tutorial.

## Com funciona per dins

```
 Participants (mòbil)          Presentadora (projector)
        |                              |
        |  index.html a GitHub Pages   |
        +--------------+---------------+
                       |   peticions (GET / POST)
                       v
        Google Apps Script  (apps-script/Codi.gs)   <- el «porter»: valida i escriu
                       |
                       v
        Full de càlcul de Google  <- el registre: Respostes · Estat · Resum
```

- **No hi ha servidor propi.** La pàgina és un sol fitxer HTML; Google fa de base de dades (el full) i de servidor (l'Apps Script).
- **No cal que els participants tinguin cap compte**: només obren l'enllaç.
- **Quasi en directe:** la pàgina pregunta al servidor cada 2,5 segons («polling») i es redibuixa.
- **Tres vistes amb la mateixa pàgina**, segons el final de l'adreça:
  - sense res: participant;
  - `#presenta`: projecció i controls (cal la clau);
  - `#resum`: resum anònim públic (només si la presentadora el publica).

## Què cal canviar per fer-ho teu

| Vull... | On ho faig |
|---|---|
| Canviar, afegir o treure preguntes i opcions | Llista `QS` d'`index.html` **i** llista `QS` de `Codi.gs` (idèntiques, lletra per lletra), `TITOLS` de `Codi.gs` i després executar `configura()`. Actualitza també `preguntes.md` |
| Fer servir el meu propi full de càlcul | Crear-lo, enganxar-hi `Codi.gs`, publicar-lo i posar l'adreça `/exec` a la variable `API` d'`index.html` |
| Triar la meva clau de presentadora | Constant `CLAU` de `Codi.gs` (a l'editor d'Apps Script, no al repositori públic) |
| Canviar colors i aparença | Variables `--teal`, `--orange`, `--c0`…`--c4` al començament del CSS d'`index.html` |
| Canviar títols i textos de la interfície | Textos entre cometes a `index.html` (títol, botons, ajudes) |
| Fer-ho més o menys «en directe» | Constant `POLL_MS` d'`index.html` (2500 = 2,5 s) |
| Que no es demani nom ni centre | Esborrar el bloc «Nom i centre» de la funció `renderPart` d'`index.html` |

**Regles que convé recordar:**
- Entre 2 i 5 opcions per pregunta (hi ha 5 colors de franja).
- El text de cada opció ha de ser **exactament el mateix** a `index.html` i a `Codi.gs`: el servidor valida i compta per coincidència de text.
- Cada cop que canviïs `Codi.gs` cal tornar a desplegar: `Desplega > Gestiona els desplegaments > Edita > Nova versió`.
- Executar `configura()` buida les respostes. Fes-ho abans de la sessió, no després.

## Idees per adaptar-ho

- **Diagnosi inicial d'una assignatura o d'un projecte:** «Quant coneixes X?» amb opcions de menys a més.
- **Detecció de coneixements previs:** una pregunta per concepte clau, i el resum final serveix per planificar la propera sessió.
- **Debat de postura:** preguntes d'acord / en desacord / dubto, i fer parlar els qui es posicionen en minoria.
- **Revisió final:** repetir les mateixes preguntes al final i comparar amb el resum del principi.
- **Formació entre iguals:** deixar que els qui han triat «ho domino» expliquin als qui han triat «no ho conec».

## Per aprendre'n més

Si vols fer servir aquest projecte a classe de tecnologia o programació, hi ha conceptes reals per treballar:

- **Client i servidor**: què fa la pàgina i què fa l'Apps Script.
- **Dades en un full de càlcul** com a base de dades senzilla (taules, fórmules `COUNTIF`).
- **Peticions HTTP** (GET per llegir, POST per escriure) i dades en format JSON.
- **Privadesa i seguretat bàsica**: per què la clau és al servidor, per què es neteja el text rebut, què s'anonimitza al resum.
- **Disseny adaptable**: la mateixa pàgina funciona al projector i al mòbil (CSS `grid` i `clamp`).
