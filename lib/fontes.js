// Busca trechos dos materiais de apoio (PDFs importados com `npm run importar-fontes`)
// - fontes_expositor/{COD}_{cap}: comentário versículo a versículo, por capítulo
// - fontes_panorama/{COD}: trechos das apostilas "Encontro com a Palavra" e de "A Bíblia na História"
export async function buscarFontes(db, codigo, c1, c2) {
  try {
    const caps = [];
    for (let c = c1; c <= Math.min(c2, c1 + 5); c++) caps.push(c);
    const [exp, pan] = await Promise.all([
      db.getAll(...caps.map((c) => db.doc(`fontes_expositor/${codigo}_${c}`))),
      db.doc(`fontes_panorama/${codigo}`).get(),
    ]);

    const partes = [];
    const porCap = Math.floor(14000 / caps.length);
    const comentarios = exp.filter((d) => d.exists).map((d, i) => `Capítulo ${caps[i]}: ${d.data().t.slice(0, porCap)}`);
    if (comentarios.length) partes.push(`[Bíblia de Estudo do Expositor — comentário]\n${comentarios.join("\n")}`);

    if (pan.exists) {
      const nota = (x) => (x.caps || []).filter((c) => c >= c1 && c <= c2).length * 5 + 1;
      const escolhidos = [];
      let total = 0;
      for (const x of [...pan.data().trechos].sort((a, b) => nota(b) - nota(a))) {
        if (total > 7000) break;
        escolhidos.push(`[${x.f}] ${x.t}`);
        total += x.t.length;
      }
      if (escolhidos.length) partes.push(escolhidos.join("\n\n"));
    }
    return partes.join("\n\n");
  } catch (e) {
    console.error("fontes", e);
    return "";
  }
}
