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
