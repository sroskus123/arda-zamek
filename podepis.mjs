// Podepíše stavy.json klíčem seznamu a složí web/povolene.json. Běží v GitHub Action (Node 20),
// stejné formáty jako nástroj v Javě (ArdaZamek/nastroje): podepisují se přesně bajty uložené v "data".
import { createPrivateKey, createPublicKey, sign, verify } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const POVOLENE_STAVY = new Set(["povoleno", "zamceno"]);

function chyba(zprava) {
    console.error("CHYBA: " + zprava);
    process.exit(1);
}

function klicZTextu(text, typ) {
    const der = Buffer.from(text.trim(), "base64");
    return typ === "tajny"
        ? createPrivateKey({ key: der, format: "der", type: "pkcs8" })
        : createPublicKey({ key: der, format: "der", type: "spki" });
}

// ── klíče ──────────────────────────────────────────────────────────────────
const tajnyText = process.env.SEZNAM_TAJNY;
if (!tajnyText) chyba("chybí tajný klíč seznamu (secret SEZNAM_TAJNY)");
const klicSeznamu = klicZTextu(tajnyText, "tajny");
const hlavniVerejny = klicZTextu(readFileSync("hlavni.verejny.txt", "utf8"), "verejny");

// ── servery: podepsané doma hlavním klíčem, tady se jen zkontrolují ──────────
const servery = JSON.parse(readFileSync("servery.podepsane.json", "utf8"));
if (typeof servery.data !== "string" || typeof servery.podpis !== "string") chyba("servery.podepsane.json nemá data a podpis");
const serveryBajty = Buffer.from(servery.data, "base64");
if (!verify(null, serveryBajty, hlavniVerejny, Buffer.from(servery.podpis, "base64"))) {
    chyba("servery.podepsane.json nemá platný podpis hlavním klíčem");
}
const serveryData = JSON.parse(serveryBajty.toString("utf8"));
const verejnySeznamuVServerech = createPublicKey(klicSeznamu).export({ format: "der", type: "spki" }).toString("base64");
if (serveryData.klic_seznamu !== verejnySeznamuVServerech) {
    chyba("servery.podepsane.json nese jiný klíč seznamu než secret SEZNAM_TAJNY");
}
const idServeru = new Set(serveryData.servery.map(s => s.id));

// ── stavy: upravuje majitel v prohlížeči ─────────────────────────────────────
const stavy = JSON.parse(readFileSync("stavy.json", "utf8"));
if (!(typeof stavy.platnost_hodin === "number" && stavy.platnost_hodin > 0 && stavy.platnost_hodin <= 24 * 365)) {
    chyba("stavy.json: platnost_hodin musí být kladné číslo hodin");
}
for (const cast of ["servery"]) {
    const mapa = stavy[cast] ?? {};
    if (typeof mapa !== "object" || Array.isArray(mapa)) chyba(`stavy.json: ${cast} musí být objekt id → stav`);
    for (const [id, stav] of Object.entries(mapa)) {
        if (!POVOLENE_STAVY.has(stav)) chyba(`stavy.json: ${cast} ${id} má neznámý stav „${stav}“ (povoleno / zamceno)`);
    }
}
for (const id of idServeru) {
    if (!(id in (stavy.servery ?? {}))) console.warn(`POZOR: server ${id} nemá ve stavy.json žádný stav, nenastartuje`);
}

const podepsaneStavy = {
    vydano: Math.floor(Date.now() / 1000),
    platnost_hodin: stavy.platnost_hodin,
    servery: stavy.servery ?? {},
};
const stavyBajty = Buffer.from(JSON.stringify(podepsaneStavy), "utf8");
const stavyPodpis = sign(null, stavyBajty, klicSeznamu).toString("base64");

// ── výstup ───────────────────────────────────────────────────────────────────
const povolene = {
    verze: 1,
    servery: { data: servery.data, podpis: servery.podpis },
    stavy: { data: stavyBajty.toString("base64"), podpis: stavyPodpis },
};
mkdirSync("web", { recursive: true });
writeFileSync("web/povolene.json", JSON.stringify(povolene, null, 2) + "\n");
writeFileSync("web/index.html", "<!doctype html><meta charset=\"utf-8\"><title>ArdaZamek</title><p>Seznam povolených serverů Příběhů Ardy.\n");
console.log(`Podepsáno: servery ${JSON.stringify(podepsaneStavy.servery)}, `
    + `platnost kopie ${podepsaneStavy.platnost_hodin} h, vydáno ${new Date(podepsaneStavy.vydano * 1000).toISOString()}`);
