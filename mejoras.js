/* =======================================================================
   Re-Late · Fisioterapia — capa de mejoras v2.0.0 · PARTE 1
   Ayudas clínicas, ficha ampliada, accesibilidad y contención de errores.
   ======================================================================= */
(function () {
  'use strict';
  var V = '2.0.0', LS = 'relate.mejoras';
  function g$(id) { return document.getElementById(id); }
  function safe(fn, tag) {
    try { return fn(); }
    catch (e) { if (window.console) console.warn('[Re-Late mejoras] ' + (tag || ''), e); return null; }
  }
  function norm(s) {
    return String(s == null ? '' : s).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/\s+/g, ' ').trim();
  }
  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }

  if (typeof window.dbAll !== 'function') {
    console.warn('[Re-Late mejoras] no se detecta la app base: la capa queda inactiva.');
    return;
  }

  /* ---------- utilidades clínicas ---------- */
  function edadDe(nac) {
    if (!nac) return null;
    var d = new Date(nac); if (isNaN(d.getTime())) return null;
    var n = new Date(), e = n.getFullYear() - d.getFullYear(), m = n.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && n.getDate() < d.getDate())) e--;
    return (e >= 0 && e < 120) ? e : null;
  }
  function imc(peso, altura) {
    if (!peso || !altura) return null;
    var a = altura / 100; return +(peso / (a * a)).toFixed(1);
  }
  /* Enright & Sherrill. Eur Respir J 1998;12:875-882 */
  function pred6mwt(p, a) {
  var h = +p.altura || 0, w = +p.peso || 0;
  var ed = (a != null ? a : edad(p));
  if (!h || !ed) return null;
  var v = (p.genero === 'F')
    ? (2.11 * h) - (2.29 * w) - (5.78 * ed) + 667
    : (7.57 * h) - (5.02 * ed) - (1.76 * w) - 309;
  return Math.round(v);
}

  /* STS-30: aproximación lineal sobre las medias de Jones et al. Phys Ther 2007 */
  function stsRef(sexo, edad) {
    var base = (sexo === 'M') ? 17 : 15;
    return Math.max(6, base - Math.max(0, Math.floor(((edad || 60) - 25) / 5)));
  }
  var EWGSOP2 = { M: 27, F: 16 };
  function fmtPaciente(p) {
    var e = edadDe(p.nacimiento), x = [];
    if (p.sexo) x.push(p.sexo === 'M' ? 'Varón' : 'Mujer');
    if (e != null) x.push(e + ' años');
    if (p.altura) x.push(p.altura + ' cm');
    if (p.peso) x.push(p.peso + ' kg');
    if (p.fase) x.push('Fase ' + p.fase);
    if (p.nyha) x.push('NYHA ' + p.nyha);
    return x.join(' · ');
  }

  /* ---------- fichas de evidencia ---------- */
  var EVIDENCIA = [
    { k: ['karvonen', 'fc de reserva'], t: 'Karvonen (FC de reserva)',
      f: 'FCobj = ((FCmax − FCreposo) × %int) + FCreposo',
      s: 'Karvonen MJ, Vuorimaa I. Sports Med 1988;5:337-349.',
      l: 'Requiere FCmáx real y FC de reposo en basal. Con betabloqueo pierde validez.' },
    { k: ['tanaka', '208'], t: 'FCmáx estimada (Tanaka)', f: 'FCmáx = 208 − 0,7 × edad',
      s: 'Tanaka H, Monahan KD, Seals DR. J Am Coll Cardiol 2001;37(1):153-156.',
      l: 'DES ≈10-12 lpm: es estimación poblacional. Prioriza la prueba de esfuerzo.' },
    { k: ['220 − edad', '220-edad', 'clásica', 'clasica'], t: 'FCmáx clásica', f: 'FCmáx = 220 − edad',
      s: 'Fox SM et al. Am J Cardiol 1971;27:510-515.',
      l: 'Subestima en jóvenes y sobreestima en mayores.' },
    { k: ['betabloqueante', 'bisoprolol', 'metoprolol', 'carvedilol', 'atenolol'],
      t: 'Betabloqueo y prescripción', f: 'FC no fiable → Borg CR10 + talk test + signos de alarma',
      s: 'ACSM Guidelines for Exercise Testing and Prescription.',
      l: 'Recorte cronotrópico de 20-30 lpm: las zonas por FC quedan infratestimadas.' },
    { k: ['zona 2', 'z2', 'zona 3', 'z3', 'umbral'], t: 'Zonas por % de reserva',
      f: 'Z1 50-60 · Z2 60-70 · Z3 70-80 · Z4 80-90 · Z5 90-100 %FCR',
      s: 'ACSM Guidelines; estratificación previa según prueba de esfuerzo.',
      l: 'En fase II fija la prescripción el umbral sintomático, no el porcentaje teórico.' },
    { k: ['borg', 'cr10', 'rpe', 'esfuerzo percibido'], t: 'Borg CR10',
      f: '0 nada · 11-13 moderado · 17-19 muy duro · 20 máximo',
      s: 'Borg G. Borg\'s Perceived Exertion and Pain Scales. Sage 1998.',
      l: 'Subjetiva: enseñar la escala antes de usarla como criterio de carga. No confundir con Borg 6-20.' },
    { k: ['eva', 'escala visual analógica'], t: 'EVA de dolor',
      f: '0-10 · cambio relevante ≈1-2 puntos (10-20 mm)',
      s: 'Kelly AM. Pain Emerg Med 2003.',
      l: 'Unidimensional: no mide función ni sueño.' },
    { k: ['tug', 'timed up and go'], t: 'TUG',
      f: '<10 s normal · 10-13,5 límite · ≥13,5 riesgo de caídas · ≥20 dependencia',
      s: 'Podsiadlo & Richardson. JAGS 1991;39:142-148. ES: Lizcano-Gil 2012.',
      l: 'El corte varía por patología: declara el utilizado.' },
    { k: ['6mwt', 'marcha 6', '6 minutos'], t: '6MWT',
      f: '%predicho = medido / esperado × 100 · MCC 26-33 m',
      s: 'ATS. Am J Respir Crit Care Med 2002;166:111-117. Enright & Sherrill 1998.',
      l: 'Depende de motivación, pasillo y O₂: registra SpO₂ y FC basal y final.' },
    { k: ['sts30', 'sts 30', 'sentarse-levantarse'], t: 'STS-30',
      f: 'Repeticiones en 30 s · referencia por edad y sexo',
      s: 'Jones CJ et al. Phys Ther 2007;87(8):1016-1025.',
      l: 'Especificar si se autoriza el apoyo de brazos.' },
    { k: ['prensión', 'prension', 'dinamometría', 'grip'], t: 'Prensión manual (EWGSOP2)',
      f: 'Baja fuerza: <27 kg varones · <16 kg mujeres',
      s: 'Cruz-Jentoft AJ et al. Age Ageing 2019;48:266-274.',
      l: 'Dinamómetro Jamar, codo 90°, antebrazo pronado, máximo de 2 intentos por mano.' },
    { k: ['velocidad de marcha', 'vel10', 'm/s'], t: 'Velocidad de marcha',
      f: '<0,8 m/s riesgo de resultados adversos · ≥1,0 m/s independencia',
      s: 'Studenski S et al. JAMA 2011;305:50-58.',
      l: 'Declarar el protocolo y si usa ayuda técnica.' },
    { k: ['berg', 'equilibrio berg'], t: 'Berg Balance Scale',
      f: '14 items × 0-4 = 0-56 · ≤45 puntos: riesgo de caídas',
      s: 'Berg K et al. Physiother Can 1992. Sherrington et al. BJSM 2019.',
      l: 'Efecto techo. Vigilar giros y apoyo monopodal en cardiopatías.' },
    { k: ['oswestry', 'odi'], t: 'Oswestry Disability Index',
      f: '0-20 leve · 21-40 moderada · 41-60 severa · >60 extrema · MCC ≈10 ptos',
      s: 'Fairbank & Pynsent. Spine 1983. Ostelo RWJ et al. Spine 2008.',
      l: 'Los items no contestados se prorratean, no se puntúan como 0.' },
    { k: ['mrc', 'disnea'], t: 'Disnea mMRC', f: '0-4 · ≥2 limita la actividad habitual',
      s: 'Bestall JC et al. Eur Respir J 1999;14:353-360.',
      l: 'No cuantifica intensidad máxima: usar junto a Borg.' },
    { k: ['spo2', 'saturación', 'saturacion'], t: 'SpO₂',
      f: '≥94 % normal · 90-93 % precaución · <90 % suspender',
      s: 'ATS/ERS y guías de rehabilitación cardiaca.',
      l: 'Poco fiable en mal perfusión, edema o melanina alta.' },
    { k: ['tensión arterial', 'sistólica', 'diastólica', 'mmhg', 'ta '], t: 'Tensión arterial',
      f: '≥180/110 crisis · ≥140/90 HTA · <90 hipotensión',
      s: 'Guía ESC/ESH de hipertensión (edición vigente).',
      l: 'TA de reposo >200/110 es contraindicación absoluta para iniciar (ACSM).' },
    { k: ['rpp', 'doble producto'], t: 'Doble producto (RPP)', f: 'RPP = FC × TA sistólica',
      s: 'Índice indirecto del consumo de O₂ miocárdico.',
      l: 'El umbral anginoso individual se fija en la prueba de esfuerzo.' },
    { k: ['glucemia', 'glucosa', 'mg/dl'], t: 'Glucemia capilar',
      f: '<70 hipoglucemia · >250 con cetosis posponer',
      s: 'ADA Standards of Care / SED.',
      l: 'Ajustar a insulina/sulfonilureas y a la última comida.' },
    { k: ['goniómetro', 'goniometro', 'rom', 'rango de movimiento'], t: 'Goniometría',
      f: 'Grados por articulación, plano y lado',
      s: 'AAOS. Joint Range of Motion Measurement Technique.',
      l: 'Fiabilidad inter-evaluador 2-5°: estandariza posición cero y estabilización.' },
    { k: ['punción seca', 'punto gatillo', 'trp'], t: 'Puntos gatillo / punción seca',
      f: 'Consentimiento específico + formación + protocolo de complicaciones',
      s: 'Travell & Simons. Myofascial Pain and Dysfunction.',
      l: 'El mapa es guía de consulta: confirma por palpación en cada paciente.' },
    { k: ['pbkdf2', '600.000', 'aes-256-gcm', 'cifrado'], t: 'Cifrado',
      f: 'AES-256-GCM + PBKDF2-HMAC-SHA256 600.000 iteraciones',
      s: 'OWASP Password Storage · NIST SP 800-132.',
      l: 'Sin custodia de clave no hay recuperación posible.' },
    { k: ['hash', 'sha-256', 'integridad'], t: 'Integridad del consentimiento',
      f: 'hash SHA-256 del texto firmado', s: 'RGPD arts. 5.2 y 7.',
      l: 'Acredita integridad del texto, no la identidad del firmante.' },
    { k: ['wger', 'cc-by-sa'], t: 'Ejercicios importados',
      f: 'Licencia CC-BY-SA · atribución obligatoria', s: 'wger.de (base abierta).',
      l: 'Importar no es prescribir: revisa indicación y contraindicación.' }
  ];

  /* ---------- tooltip ---------- */
  var eviBox = null, eviT = null;
  function buscarEv(txt) {
    var n = norm(txt); if (!n || n.length > 60) return null;
    for (var i = 0; i < EVIDENCIA.length; i++)
      for (var j = 0; j < EVIDENCIA[i].k.length; j++)
        if (n.indexOf(norm(EVIDENCIA[i].k[j])) !== -1) return EVIDENCIA[i];
    return null;
  }
  function mostrarEv(item, x, y) {
    safe(function () {
      if (!eviBox) { eviBox = el('div'); eviBox.id = 'rl-evi'; eviBox.setAttribute('role', 'tooltip'); document.body.appendChild(eviBox); }
      eviBox.innerHTML = '';
      eviBox.appendChild(el('h4', null, item.t));
      eviBox.appendChild(el('div', 'rl-f', item.f));
      eviBox.appendChild(el('div', 'rl-s', 'Fuente: ' + item.s));
      eviBox.appendChild(el('div', 'rl-l', 'Limitación: ' + item.l));
      eviBox.classList.add('rl-on');
      var w = eviBox.offsetWidth || 380;
      eviBox.style.left = (Math.min(Math.max(8, x + 14), window.innerWidth - w - 12) + window.scrollX) + 'px';
      eviBox.style.top = (y + window.scrollY + 16) + 'px';
    }, 'evi');
  }
  function ocultarEv() { safe(function () { if (eviBox) eviBox.classList.remove('rl-on'); }); }

  /* ---------- avisos y panel ---------- */
  var toastBox = null;
  function rtoast(msg, tipo, ms) {
    safe(function () {
      if (!toastBox) { toastBox = el('div'); toastBox.id = 'rl-toasts'; document.body.appendChild(toastBox); }
      var t = el('div', 'rl-toast' + (tipo ? ' rl-' + tipo : ''), msg);
      t.setAttribute('role', 'status'); toastBox.appendChild(t);
      setTimeout(function () { safe(function () { if (t.parentNode) toastBox.removeChild(t); }); }, ms || 5200);
    }, 'rtoast');
  }
  function abrirPanel(titulo, filas) {
    safe(function () {
      var p = g$('rl-panel'); if (p) p.parentNode.removeChild(p);
      p = el('div'); p.id = 'rl-panel';
      var box = el('div', 'rl-box');
      box.appendChild(el('h3', null, titulo));
      var tb = el('table');
      for (var i = 0; i < filas.length; i++) {
        var tr = el('tr'); tr.appendChild(el('td', null, filas[i][0]));
        var td = el('td');
        if (filas[i][2]) td.appendChild(el('span', 'rl-pill ' + filas[i][2], filas[i][1]));
        else td.textContent = filas[i][1];
        tr.appendChild(td); tb.appendChild(tr);
      }
      box.appendChild(tb);
      var pie = el('p', null, 'Alt+H ayuda · Alt+M estado · Alt+A contraste · Alt+F legible · Alt+E export cifrado · Alt+P imprimir');
      pie.style.cssText = 'margin-top:12px;font-size:12px;color:#64748b'; box.appendChild(pie);
      var c = el('button', null, 'Cerrar');
      c.style.cssText = 'margin-top:8px;padding:8px 16px;border-radius:8px;border:1px solid #cbd5e1;background:#f8fafc;cursor:pointer';
      c.onclick = function () { p.classList.remove('rl-on'); };
      box.appendChild(c); p.appendChild(box);
      p.onclick = function (e) { if (e.target === p) p.classList.remove('rl-on'); };
      document.body.appendChild(p); p.classList.add('rl-on');
    }, 'panel');
  }

  /* ---------- contención de errores ---------- */
  var errores = [];
  function logError(e, ctx) {
    errores.push({ t: new Date().toISOString(), ctx: ctx || '', msg: (e && e.message) || String(e) });
    if (window.console) console.error('[Re-Late] ' + ctx, e);
    safe(function () { audit('error_app', 'sistema', null, null, { contexto: ctx, mensaje: String((e && e.message) || e) }); });
  }
  window.addEventListener('error', function (e) { safe(function () { logError(e.error || e.message, 'window.onerror'); }); });
  window.addEventListener('unhandledrejection', function (e) { safe(function () { logError(e.reason, 'promesa no capturada'); }); });

  var _render = render;
  render = async function () {
    try { await _render(); }
    catch (e) {
      logError(e, 'render:' + state.view);
      safe(function () {
        var v = g$('view'); if (!v) return;
        v.insertAdjacentHTML('afterbegin',
          '<div class="rl-banner rev"><strong>El módulo «' + esc(state.view) + '» ha fallado y se ha detenido para no perder la sesión.</strong><br>' +
          '<span style="font-size:11px">' + esc(String((e && e.message) || e)) + '</span><br>' +
          '<button onclick="go(\'dashboard\')" class="mt-2 text-xs bg-white border rounded px-3 py-1.5 cursor-pointer">Volver al panel</button></div>');
      });
    }
    if (window.RL && window.RL.post) safe(window.RL.post, 'post');
  };

  /* ---------- ficha de paciente ampliada ---------- */
  function bloqueExt(p) {
    p = p || {};
    function sel(id, opts, val, label) {
      return '<div><label class="block text-xs font-semibold text-slate-500">' + label + '</label>' +
        '<select id="' + id + '" class="w-full p-2 border rounded-lg bg-white mb-2">' +
        opts.map(function (o) {
          return '<option value="' + o[0] + '"' + (String(val || '') === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
        }).join('') + '</select></div>';
    }
    function chk(id, txt, val) {
      return '<label class="flex items-start gap-2 text-xs mb-2"><input type="checkbox" id="' + id + '" class="mt-0.5"' +
        (val ? ' checked' : '') + '><span>' + txt + '</span></label>';
    }
    return '<div class="sm:col-span-2 mt-3 pt-3 border-t">' +
      '<p class="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Datos para interpretar las pruebas</p>' +
      '<div class="grid sm:grid-cols-3 gap-2">' +
      sel('rlSexo', [['', 'Sexo —'], ['M', 'Varón'], ['F', 'Mujer']], p.sexo, 'Sexo (exigido por 6MWT, STS-30 y prensión)') +
      '<div><label class="block text-xs font-semibold text-slate-500">Altura (cm)</label><input id="rlAltura" type="number" step="0.1" value="' + (p.altura || '') + '" placeholder="170" class="w-full p-2 border rounded-lg mb-2"></div>' +
      '<div><label class="block text-xs font-semibold text-slate-500">Peso (kg)</label><input id="rlPeso" type="number" step="0.1" value="' + (p.peso || '') + '" placeholder="78" class="w-full p-2 border rounded-lg mb-2"></div>' +
      sel('rlFase', [['', 'Fase RCard —'], ['I', 'I · hospitalaria'], ['II', 'II · ambulatoria'], ['III', 'III · mantenimiento']], p.fase, 'Fase de rehabilitación cardiaca') +
      sel('rlNyha', [['', 'NYHA —'], ['I', 'NYHA I'], ['II', 'NYHA II'], ['III', 'NYHA III'], ['IV', 'NYHA IV']], p.nyha, 'Clase funcional NYHA') +
      sel('rlDisp', [['', 'Dispositivo —'], ['none', 'Ninguno'], ['mp', 'Marcapasos'], ['dai', 'DAI'], ['stent', 'Stent / ICP'], ['cirugia', 'Cirugía cardiaca']], p.dispositivo, 'Dispositivo / antecedente') +
      '</div><div class="grid sm:grid-cols-2 gap-2 mt-1">' +
      chk('rlBeta', 'Toma <strong>betabloqueantes</strong> (la FC no es fiable: prescribir por Borg)', p.betabloqueante) +
      chk('rlAnticoag', '<strong>Anticoagulación</strong> activa (cautela en punción seca)', p.anticoagulado) +
      '</div></div>';
  }
  function leerExt() {
    if (!g$('rlSexo')) return {};
    return {
      sexo: g$('rlSexo').value || '',
      altura: +(g$('rlAltura') || {}).value || null,
      peso: +(g$('rlPeso') || {}).value || null,
      fase: (g$('rlFase') || {}).value || '',
      nyha: (g$('rlNyha') || {}).value || '',
      dispositivo: (g$('rlDisp') || {}).value || '',
      betabloqueante: !!(g$('rlBeta') || {}).checked,
      anticoagulado: !!(g$('rlAnticoag') || {}).checked
    };
  }

  var _newPatient = newPatient;
  newPatient = function () {
    _newPatient();
    safe(function () {
      var grid = g$('modalBody').querySelector('.grid');
      if (grid) grid.insertAdjacentHTML('beforeend', bloqueExt());
    });
  };

  savePatient = async function () {
    var nombre = g$('npNombre').value.trim();
    if (!nombre) return toast('El nombre es obligatorio');
    var ext = leerExt(), pats = await dbAll('patients'), dni = g$('npDni').value.trim();
    if (dni && pats.some(function (p) { return (p.dni || '').trim() === dni; }))
      return toast('⚠️ Ya existe un paciente con ese DNI / número de historia');
    var usados = pats.map(function (p) { return String(p.codigo); }), codigo;
    do { codigo = String(Math.floor(1000 + Math.random() * 9000)); } while (usados.indexOf(codigo) !== -1);
    var p = Object.assign({
      nombre: nombre, dni: dni, telefono: g$('npTel').value, nacimiento: g$('npNac').value,
      edad: edadDe(g$('npNac').value), riesgo: g$('npRiesgo').value, patologia: g$('npPat').value,
      alergias: g$('npAlg').value,
      etiquetas: g$('npTags').value.split(',').map(function (s) { return s.trim(); }).filter(Boolean),
      terapeuta: g$('npTer').value, creado: new Date().toISOString(), pines: [], codigo: codigo
    }, ext);
    if (p.altura && p.peso) p.imc = imc(p.peso, p.altura);
    var id = await dbAdd('patients', p);
    await audit('crear', 'patient', id, null, { nombre: p.nombre, riesgo: p.riesgo });
    closeModal(); toast('Paciente creado · Código portal: ' + codigo); render();
  };

  editPatient = async function (id) {
    var p = await dbGet('patients', id);
    openModal('Editar paciente',
      '<input id="epNombre" value="' + esc(p.nombre) + '" class="w-full p-2 border rounded-lg mb-2" placeholder="Nombre y apellidos">' +
      '<div class="grid grid-cols-2 gap-2 mb-2"><input id="epDni" value="' + esc(p.dni || '') + '" placeholder="DNI / Nº historia" class="p-2 border rounded-lg">' +
      '<input id="epTel" value="' + esc(p.telefono || '') + '" placeholder="Teléfono" class="p-2 border rounded-lg"></div>' +
      '<label class="block text-xs font-semibold text-slate-500 mb-1">Fecha de nacimiento</label>' +
      '<input id="epNac" type="date" value="' + esc(p.nacimiento || '') + '" class="w-full p-2 border rounded-lg mb-2">' +
      '<input id="epPat" value="' + esc(p.patologia || '') + '" placeholder="Diagnóstico" class="w-full p-2 border rounded-lg mb-2">' +
      '<input id="epAlg" value="' + esc(p.alergias || '') + '" placeholder="Alergias / contraindicaciones" class="w-full p-2 border rounded-lg mb-2">' +
      '<input id="epTags" value="' + esc((p.etiquetas || []).join(', ')) + '" placeholder="Etiquetas" class="w-full p-2 border rounded-lg mb-2">' +
      '<select id="epRiesgo" class="w-full p-2 border rounded-lg mb-2 bg-white">' +
      '<option value="normal"' + (p.riesgo !== 'alto' ? ' selected' : '') + '>Riesgo normal</option>' +
      '<option value="alto"' + (p.riesgo === 'alto' ? ' selected' : '') + '>⚠ Riesgo alto</option></select>' +
      bloqueExt(p) +
      '<button onclick="updatePatient(' + id + ')" class="w-full brand-bg text-white py-2.5 rounded-lg font-semibold">Actualizar</button>');
  };

  updatePatient = async function (id) {
    var a = await dbGet('patients', id);
    var d = Object.assign({}, a, {
      nombre: g$('epNombre').value, dni: g$('epDni').value, telefono: g$('epTel').value,
      nacimiento: g$('epNac').value, edad: edadDe(g$('epNac').value),
      patologia: g$('epPat').value, alergias: g$('epAlg').value, riesgo: g$('epRiesgo').value,
      etiquetas: g$('epTags').value.split(',').map(function (s) { return s.trim(); }).filter(Boolean)
    }, leerExt());
    if (d.altura && d.peso) d.imc = imc(d.peso, d.altura);
    await dbPut('patients', d);
    await audit('editar', 'patient', id,
      { riesgo: a.riesgo, patologia: a.patologia, sexo: a.sexo },
      { riesgo: d.riesgo, patologia: d.patologia, sexo: d.sexo });
    closeModal(); toast('Paciente actualizado'); openPatient(id);
  };

  var _patientCard = patientCard;
  patientCard = function (p) {
    var base = _patientCard(p), chips = '';
    if (p.sexo || p.nacimiento) {
      var e = edadDe(p.nacimiento);
      chips += '<span class="rl-chip">' + (p.sexo === 'M' ? 'Varón' : p.sexo === 'F' ? 'Mujer' : '—') + (e != null ? ' · ' + e + ' a' : '') + '</span>';
    }
    if (p.fase) chips += '<span class="rl-chip teal">Fase ' + esc(p.fase) + '</span>';
    if (p.nyha) chips += '<span class="rl-chip">NYHA ' + esc(p.nyha) + '</span>';
    if (p.betabloqueante) chips += '<span class="rl-chip amber">Beta-bloqueo</span>';
    if (p.anticoagulado) chips += '<span class="rl-chip red">Anticoagulado</span>';
    if (!chips) return base;
    var i = base.lastIndexOf('</div></div>');
    return i === -1 ? base : base.slice(0, i) + chips + base.slice(i);
  };

  var _openPatient = openPatient;
  openPatient = async function (id) {
    await _openPatient(id);
    safe(async function () {
      var p = await dbGet('patients', id);
      var ass = (await dbAll('assessments')).filter(function (a) { return a.patientId === id; });
      var cons = ass.filter(function (a) { return a.tipo === 'constantes'; })
        .sort(function (a, b) { return String(b.fecha + (b.hora || '')).localeCompare(String(a.fecha + (a.hora || ''))); });
      var zonas = ass.filter(function (a) { return a.tipo === 'zonas'; })[0];
      var ult = cons[0], body = g$('modalBody');
      if (!body) return;
      body.insertAdjacentHTML('afterbegin',
        '<div class="rl-resumen"><strong>Ficha de interpretación</strong><br>' +
        esc(fmtPaciente(p) || 'Faltan datos: pulsa Editar y completa sexo, altura y peso') +
        (p.imc ? ' · IMC ' + p.imc : '') +
        (ult ? '<br><span class="text-xs">Últimas constantes (' + fdate(ult.fecha) + ' ' + esc(ult.hora || '') + '): ' +
          [ult.tas ? 'TA ' + ult.tas + '/' + ult.tad : '', ult.fc ? 'FC ' + ult.fc : '', ult.spo2 ? 'SpO₂ ' + ult.spo2 + '%' : '', ult.glucemia ? 'Glu ' + ult.glucemia : '']
            .filter(Boolean).join(' · ') + (ult.tas && ult.fc ? ' · RPP ' + (ult.fc * ult.tas).toLocaleString('es-ES') : '') + '</span>' : '') +
        (zonas ? '<br><span class="text-xs">Zonas guardadas: ' + esc(zonas.notas || '') + '</span>' : '') + '</div>');
      if (edadDe(p.nacimiento) == null && !p.sexo)
        body.insertAdjacentHTML('afterbegin',
          '<div class="rl-banner rev">⚠️ Sin <strong>sexo</strong> ni <strong>fecha de nacimiento</strong> no se pueden interpretar el 6MWT, la STS-30 ni la prensión manual. Completa la ficha.</div>');
    }, 'openPatient-ext');
  };

  /* ---------- accesibilidad y teclado ---------- */
  document.addEventListener('mouseover', function (ev) {
    var t = ev.target; if (!t || !t.closest) return;
    var host = t.closest('button,a,th,td,label,h1,h2,h3,h4,span,li,p,strong');
    if (!host) return;
    var item = buscarEv(host.textContent);
    clearTimeout(eviT);
    if (item) mostrarEv(item, ev.clientX, ev.clientY); else ocultarEv();
  }, true);
  document.addEventListener('mouseout', function () { eviT = setTimeout(ocultarEv, 200); }, true);
  document.addEventListener('scroll', ocultarEv, true);
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') { ocultarEv(); var p = g$('rl-panel'); if (p) p.classList.remove('rl-on'); }
    if (!ev.altKey) return;
    var c = (ev.key || '').toLowerCase();
    if (c === 'h') {
      ev.preventDefault();
      abrirPanel('Capa de mejoras v' + V, [
        ['Qué hace', 'Mejoras clínicas, de seguridad y de accesibilidad aplicadas como capa externa sobre index.html.'],
        ['Alt+M', 'Estado técnico de la aplicación (ideal antes de una demo)'],
        ['Alt+A', 'Alto contraste'], ['Alt+F', 'Modo legible (texto grande y contraste)'],
        ['Alt+E', 'Exportar copia de seguridad cifrada'], ['Alt+P', 'Imprimir con cabecera y pie'],
        ['Ratón', 'Sobre Karvonen, TUG, 6MWT, EVA, Borg, RPP… muestra fórmula, fuente y limitación'],
        ['Aviso', 'Prototipo de demostración con datos ficticios: no validado para uso clínico.']]);
    } else if (c === 'a') {
      ev.preventDefault(); document.documentElement.classList.toggle('rl-alto-contraste');
      safe(function () { localStorage.setItem(LS + '.ac', '1'); });
      rtoast('Alto contraste ' + (document.documentElement.classList.contains('rl-alto-contraste') ? 'activo' : 'desactivado'), 'ok', 2200);
    } else if (c === 'f') {
      ev.preventDefault(); document.documentElement.classList.toggle('rl-legible');
      rtoast('Modo legible ' + (document.documentElement.classList.contains('rl-legible') ? 'activo' : 'desactivado'), 'ok', 2200);
    }
  });
  safe(function () { if (localStorage.getItem(LS + '.ac') === '1') document.documentElement.classList.add('rl-alto-contraste'); });

  /* ---------- expuesto para la PARTE 2 ---------- */
  window.RL = {
    V: V, g$: g$, safe: safe, el: el, norm: norm, rtoast: rtoast, abrirPanel: abrirPanel,
    EVIDENCIA: EVIDENCIA, errores: errores, logError: logError,
    edadDe: edadDe, imc: imc, pred6mwt: pred6mwt, stsRef: stsRef, EWGSOP2: EWGSOP2,
    fmtPaciente: fmtPaciente, bloqueExt: bloqueExt, leerExt: leerExt,
    pacCache: {}, post: null
  };
  console.info('%cRe-Late · capa v' + V + ' (parte 1)', 'color:#0f766e;font-weight:bold');
})();
/* =======================================================================
   Re-Late · Fisioterapia — capa de mejoras v2.0.0 · PARTE 2
   Panel, agenda, módulo cardiometabólico, escalas, RGPD e impresión.
   ======================================================================= */
(function () {
  'use strict';
  var RL = window.RL;
  if (!RL || typeof window.dbAll !== 'function') { console.warn('[Re-Late mejoras] falta la PARTE 1 de mejoras.js'); return; }
  var g$ = RL.g$, safe = RL.safe, el = RL.el, norm = RL.norm, rtoast = RL.rtoast, abrirPanel = RL.abrirPanel;
  var edadDe = RL.edadDe, pred6mwt = RL.pred6mwt, stsRef = RL.stsRef, EWGSOP2 = RL.EWGSOP2;
  var V = RL.V;

  function ctxPaciente() {
    var s = g$('pPac'); if (!s || !s.value) return null;
    var p = RL.pacCache[Number(s.value)]; if (!p) return null;
    return { sexo: p.sexo, edad: edadDe(p.nacimiento), altura: p.altura, peso: p.peso };
  }

  /* =============== PANEL: métricas corregidas =============== */
  viewDashboard = async function () {
    var r = await Promise.all([dbAll('patients'), dbAll('appointments'), dbAll('adherence'), dbAll('bonos'), dbAll('messages')]);
    var pats = r[0], appts = r[1], adh = r[2], bonos = r[3], msgs = r[4];
    var citasHoy = appts.filter(function (a) { return a.fecha === hoy(); });
    var corte = Date.now() - 30 * 864e5;
    var adh30 = adh.filter(function (a) { return new Date(a.fecha).getTime() >= corte; });
    var evaMedia = adh30.length ? (adh30.reduce(function (s, a) { return s + (+a.eva || 0); }, 0) / adh30.length).toFixed(1) : '—';
    var peor = adh30.reduce(function (m, a) { return Math.max(m, +a.eva || 0); }, 0);
    var alertas = pats.filter(function (p) { return p.riesgo === 'alto' || (p.alergias || '').trim() || p.anticoagulado; });

    var sinActividad = [], abandonados = [];
    pats.forEach(function (p) {
      var f = [];
      adh.filter(function (a) { return a.patientId === p.id; }).forEach(function (a) { f.push(a.fecha); });
      appts.filter(function (a) { return a.patientId === p.id && a.estado === 'completada'; }).forEach(function (a) { f.push(a.fecha); });
      if (p.creado) f.push(p.creado);
      if (!f.length) { sinActividad.push(p); return; }
      var last = new Date(f.sort()[f.length - 1]);
      if ((Date.now() - last.getTime()) > 7 * 864e5) abandonados.push(p);
    });

    var noLeidos = msgs.filter(function (m) { return m.de === 'paciente' && !m.leido; }).length;
    var pendiente = bonos.reduce(function (s, b) { return s + ((+b.precio || 0) - (+b.pagado || 0)); }, 0);
    var agotados = bonos.filter(function (b) { return (b.consumidas || 0) >= (+b.total || 0); }).length;

    g$('view').innerHTML =
      '<h2 class="text-2xl font-bold mb-1">Panel clínico</h2>' +
      '<p class="text-sm text-slate-500 mb-4">Resumen operativo · ' + new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) + '</p>' +
      '<div class="rl-banner info">Indicadores de los <strong>últimos 30 días</strong>. El abandono usa la última actividad registrada (adherencia, cita completada o alta); los pacientes sin ningún registro se listan aparte.</div>' +
      '<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">' +
      statCard('Pacientes', pats.length, '🧑‍⚕️', 'brand-text') +
      statCard('Citas hoy', citasHoy.length, '📅', 'text-blue-600') +
      statCard('EVA media 30 d', evaMedia + (peor ? ' · máx ' + peor : ''), '📈', 'text-amber-600') +
      statCard('Mensajes nuevos', noLeidos, '💬', 'text-purple-600') + '</div>' +
      '<div class="grid lg:grid-cols-2 gap-4">' +
      '<div class="card p-5"><h3 class="font-bold mb-3">🕐 Citas de hoy</h3>' +
      (citasHoy.length ? citasHoy.sort(function (a, b) { return String(a.hora).localeCompare(String(b.hora)); }).map(function (c) {
        return '<div class="flex justify-between items-center py-2 border-b last:border-0"><div><p class="font-medium text-sm">' + esc(c.pacienteNombre) + '</p><p class="text-xs text-slate-500">' + esc(c.terapeuta || '') + '</p></div><span class="badge bg-teal-100 text-teal-700">' + esc(c.hora) + '</span></div>';
      }).join('') : '<p class="text-sm text-slate-400">Sin citas hoy.</p>') + '</div>' +
      '<div class="card p-5"><h3 class="font-bold mb-3">⚠️ Alertas</h3>' +
      (alertas.length ? alertas.slice(0, 5).map(function (p) {
        return '<div class="flex justify-between items-center py-2 border-b last:border-0"><div><p class="font-medium text-sm">' + esc(p.nombre) + '</p>' +
          '<p class="text-xs text-red-500">' + (p.riesgo === 'alto' ? 'Riesgo alto ' : '') + (p.alergias ? '· ' + esc(p.alergias) + ' ' : '') + (p.anticoagulado ? '· Anticoagulado' : '') + '</p></div>' +
          '<button onclick="openPatient(' + p.id + ')" class="text-xs text-teal-700 underline">Ver</button></div>';
      }).join('') : '<p class="text-sm text-slate-400">Sin alertas.</p>') +
      (abandonados.length ? '<p class="mt-3 text-xs text-amber-700 bg-amber-50 p-2 rounded">🔔 ' + abandonados.length + ' paciente(s) sin actividad en más de 7 días.</p>' : '') +
      (sinActividad.length ? '<p class="mt-2 text-xs text-red-700 bg-red-50 p-2 rounded">🚫 ' + sinActividad.length + ' paciente(s) sin ningún registro de actividad.</p>' : '') +
      (pendiente > 0 ? '<p class="mt-2 text-xs text-blue-700 bg-blue-50 p-2 rounded">💳 Pendiente de cobro: ' + eur(pendiente) + '</p>' : '') +
      (agotados ? '<p class="mt-2 text-xs text-slate-600 bg-slate-100 p-2 rounded">🎫 ' + agotados + ' bono(s) agotado(s).</p>' : '') +
      '</div></div>';
  };

  /* =============== AGENDA: hueco y recordatorios =============== */
  var _saveAppt = saveAppt;
  saveAppt = async function () {
    var pid = Number(g$('naPac').value);
    if (!pid) return toast('Crea primero un paciente');
    var fecha = g$('naFecha').value, hora = g$('naHora').value, ter = g$('naTer').value;
    if (!fecha || !hora) return toast('Indica fecha y hora');
    if (fecha + 'T' + hora < new Date().toISOString().slice(0, 16))
      if (!(await confirmDlg('La cita queda en una fecha anterior a ahora. ¿Programarla igualmente?', '📅 Fecha pasada'))) return;
    var appts = await dbAll('appointments');
    var choque = appts.filter(function (a) {
      return a.fecha === fecha && a.hora === hora && a.estado !== 'cancelada' && (!ter || !a.terapeuta || a.terapeuta === ter);
    });
    if (choque.length)
      if (!(await confirmDlg('Ya hay cita a la misma hora' + (ter ? ' para ' + ter : '') + ': ' +
        choque.map(function (c) { return c.pacienteNombre; }).join(', ') + '. ¿Crear igualmente?', '⚠️ Solapamiento de agenda'))) return;
    await _saveAppt();
  };

  setInterval(function () {
    safe(function () {
      if (!state.user || !reminders || !reminders.length) return;
      var ahora = Date.now();
      reminders.filter(function (r) { return r.estado === 'programado'; }).forEach(function (r) {
        var t = new Date(r.fecha + 'T' + r.hora).getTime() - 3600000;
        if (ahora >= t && ahora < t + 120000) {
          r.estado = 'enviado';
          if ('Notification' in window && Notification.permission === 'granted')
            try { new Notification('Recordatorio de cita', { body: r.nombre + ' · ' + r.hora }); } catch (e) { }
          toast('🔔 ' + r.nombre + ' a las ' + r.hora); saveReminders();
        }
      });
    }, 'heartbeat');
  }, 60000);

  /* =============== ZONAS (Karvonen) =============== */
  cZonas = function () {
    g$('cardioContent').innerHTML =
      '<div class="rl-banner rev">Calculadora de apoyo. Las zonas por frecuencia cardíaca <strong>no sustituyen</strong> el umbral de la prueba de esfuerzo ni el criterio del cardiólogo.</div>' +
      '<div class="grid lg:grid-cols-2 gap-4"><div class="card p-5">' +
      '<h3 class="font-bold mb-3 text-sm">❤️ Zonas de entrenamiento (Karvonen)</h3>' +
      '<label class="text-xs font-semibold text-slate-500">Paciente (autocompleta edad y betabloqueo)</label>' +
      '<select id="rlZPac" class="w-full p-2 border rounded-lg mb-2 bg-white"></select>' +
      '<div class="grid grid-cols-2 gap-2">' +
      '<div><label class="text-xs font-semibold text-slate-500">Edad</label><input id="zEdad" type="number" value="55" class="w-full p-2 border rounded-lg mb-2"></div>' +
      '<div><label class="text-xs font-semibold text-slate-500">FC reposo (lpm)</label><input id="zReposo" type="number" value="70" class="w-full p-2 border rounded-lg mb-2"></div></div>' +
      '<label class="text-xs font-semibold text-slate-500">FCmáx real (prueba de esfuerzo)</label>' +
      '<input id="zMax" type="number" placeholder="Vacío = estimar por edad" class="w-full p-2 border rounded-lg mb-2">' +
      '<label class="text-xs font-semibold text-slate-500">Fórmula de estimación</label>' +
      '<select id="zForm" class="w-full p-2 border rounded-lg mb-3 bg-white">' +
      '<option value="tanaka">Tanaka 2001 · 208 − 0,7 × edad (recomendada)</option>' +
      '<option value="clasica">Clásica 1971 · 220 − edad</option></select>' +
      '<label class="flex items-start gap-2 text-xs mb-3"><input id="zBeta" type="checkbox" class="mt-0.5">' +
      '<span>Paciente con <strong>betabloqueantes</strong> u otro cronotropo negativo</span></label>' +
      '<button onclick="zCalc()" class="w-full brand-bg text-white py-2.5 rounded-lg font-semibold">Calcular zonas</button></div>' +
      '<div id="zOut" class="card p-5"><p class="text-sm text-slate-400">Selecciona el paciente y pulsa «Calcular zonas».</p></div></div>';
    dbAll('patients').then(function (ps) {
      RL.pacCache = {}; ps.forEach(function (p) { RL.pacCache[p.id] = p; });
      var s = g$('rlZPac'); if (!s) return;
      s.innerHTML = '<option value="">— Elegir paciente —</option>' + ps.map(function (p) { return '<option value="' + p.id + '">' + esc(p.nombre) + '</option>'; }).join('');
      s.onchange = async function () {
        var p = await dbGet('patients', Number(s.value)); if (!p) return;
        var e = edadDe(p.nacimiento); if (e != null) g$('zEdad').value = e;
        g$('zBeta').checked = !!p.betabloqueante;
        var ult = (await dbAll('assessments')).filter(function (a) { return a.patientId === p.id && a.tipo === 'constantes' && a.fc; })
          .sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); })[0];
        if (ult && /reposo/i.test(ult.momento || '')) g$('zReposo').value = ult.fc;
      };
    });
  };
  var ZONAS = [
    ['Z1 · Recuperación', .50, .60, 'Muy suave · conversación fácil', 'Borg CR10 9-11'],
    ['Z2 · Aeróbico base', .60, .70, 'Suave · conversación cómoda', 'Borg CR10 11-13'],
    ['Z3 · Aeróbico', .70, .80, 'Moderado · frases cortas', 'Borg CR10 13-15'],
    ['Z4 · Umbral', .80, .90, 'Intenso · palabras sueltas', 'Borg CR10 15-17'],
    ['Z5 · Máximo', .90, 1.0, 'Muy intenso · no puede hablar', 'Borg CR10 17-20']
  ];
  zCalc = function () {
    var edad = +g$('zEdad').value || 55, rep = +g$('zReposo').value || 70, real = +g$('zMax').value || null;
    var tanaka = Math.round(208 - 0.7 * edad), clasica = 220 - edad;
    var fcmax = real || (g$('zForm').value === 'tanaka' ? tanaka : clasica);
    var res = Math.max(0, fcmax - rep), beta = !!(g$('zBeta') || {}).checked;
    g$('zOut').innerHTML =
      '<h3 class="font-bold mb-1 text-sm">Resultado</h3>' +
      '<p class="text-xs text-slate-500 mb-3">FCmáx usada: <strong class="brand-text text-base">' + fcmax + ' lpm</strong> ' +
      (real ? '(<strong>real</strong>, prueba de esfuerzo)' : '(<strong>estimada</strong>)') + ' · FC reserva: <strong>' + res + ' lpm</strong></p>' +
      '<div class="rl-resumen text-xs">Comparación de fórmulas: Tanaka <strong>' + tanaka + '</strong> · Clásica <strong>' + clasica + '</strong> · diferencia ' + Math.abs(tanaka - clasica) + ' lpm. DES de la estimación ≈ 10-12 lpm.</div>' +
      '<div class="space-y-2">' + ZONAS.map(function (z) {
        var lo = Math.round(rep + z[1] * res), hi = Math.round(rep + z[2] * res);
        return '<div class="border rounded-lg p-3"><div class="flex justify-between items-center"><p class="font-semibold text-sm">' + z[0] + '</p>' +
          '<span class="badge bg-teal-100 text-teal-700">' + lo + '-' + hi + ' lpm</span></div>' +
          '<p class="text-xs text-slate-500 mt-1">' + z[3] + ' · ' + z[4] + '</p></div>';
      }).join('') + '</div>' +
      '<div class="mt-4 text-xs bg-amber-50 text-amber-800 rounded-lg p-3">En rehabilitación cardiaca el trabajo habitual está en <strong>Z2-Z3</strong> (Borg CR10 11-14). Ajustar a la prueba de esfuerzo y al criterio médico.</div>' +
      (beta ? '<div class="mt-2 text-xs bg-red-50 text-red-700 rounded-lg p-3">🔴 <strong>Betabloqueo:</strong> las zonas por FC <strong>no son fiables</strong>. Prescribe por <strong>Borg CR10 11-14</strong> y <em>talk test</em>.</div>' : '') +
      '<div class="mt-3 text-[11px] text-slate-400">Karvonen &amp; Vuorimaa. Sports Med 1988 · Tanaka et al. JACC 2001;37:153-156.</div>' +
      '<button onclick="zSave(' + fcmax + ',' + res + ')" class="mt-3 w-full bg-slate-200 py-2 rounded-lg text-sm font-semibold">💾 Guardar en el paciente</button>';
  };

  /* =============== CONSTANTES: RPP y alertas coherentes =============== */
  cConstantes = function () {
    g$('cardioContent').innerHTML =
      '<div class="grid lg:grid-cols-2 gap-4"><div class="card p-5">' +
      '<h3 class="font-bold mb-3 text-sm">🩺 Registrar constantes</h3>' +
      '<select id="kPac" class="w-full p-2 border rounded-lg mb-2 bg-white"></select>' +
      '<div class="grid grid-cols-2 gap-2 mb-2">' +
      '<input id="kTas" type="number" placeholder="TA sistólica (mmHg)" class="p-2 border rounded-lg">' +
      '<input id="kTad" type="number" placeholder="TA diastólica (mmHg)" class="p-2 border rounded-lg">' +
      '<input id="kFc" type="number" placeholder="FC (lpm)" class="p-2 border rounded-lg">' +
      '<input id="kSpo2" type="number" placeholder="SpO₂ (%)" class="p-2 border rounded-lg">' +
      '<input id="kGlu" type="number" placeholder="Glucemia (mg/dL)" class="p-2 border rounded-lg">' +
      '<select id="kMom" class="p-2 border rounded-lg bg-white"><option>En reposo</option><option>Antes de la sesión</option><option>Después de la sesión</option></select></div>' +
      '<div id="rlRpp" class="text-xs font-semibold brand-text mb-2"></div>' +
      '<textarea id="kNotas" rows="2" placeholder="Observaciones / síntomas" class="w-full p-2 border rounded-lg mb-2"></textarea>' +
      '<button onclick="kSave()" class="w-full brand-bg text-white py-2.5 rounded-lg font-semibold">Guardar constantes</button>' +
      '<div id="kAlert" class="mt-3"></div>' +
      '<div class="rl-banner info mt-3">Crisis hipertensiva ≥180/110 (ESC/ESH) · contraindicación absoluta en reposo &gt;200/110 (ACSM) · SpO₂ &lt;90 % suspender · RPP = FC × TAS.</div>' +
      '</div><div class="card p-5"><h3 class="font-bold mb-3 text-sm">📊 Tendencia y últimos registros</h3>' +
      '<canvas id="rlKChart" height="110"></canvas><div id="kList" class="space-y-2 max-h-72 overflow-y-auto mt-3"></div></div></div>';
    dbAll('patients').then(function (ps) {
      var e2 = g$('kPac'); if (!e2) return;
      e2.innerHTML = ps.length ? ps.map(function (p) { return '<option value="' + p.id + '">' + esc(p.nombre) + '</option>'; }).join('') : '<option value="">— Sin pacientes —</option>';
      e2.onchange = trend;
    });
    ['kTas', 'kFc'].forEach(function (i) {
      var n = g$(i); if (n) n.addEventListener('input', function () {
        var tas = +g$('kTas').value, fc = +g$('kFc').value, box = g$('rlRpp');
        if (box) box.textContent = (tas && fc) ? 'RPP = ' + (tas * fc).toLocaleString('es-ES') + ' (FC × TAS)' : '';
      });
    });
    kList(); trend();
  };
  async function trend() {
    var pid = Number((g$('kPac') || {}).value), cv = g$('rlKChart');
    if (!cv || typeof Chart === 'undefined') return;
    var rows = (await dbAll('assessments')).filter(function (a) { return a.tipo === 'constantes' && (!pid || a.patientId === pid); })
      .sort(function (a, b) { return String(a.fecha + (a.hora || '')).localeCompare(String(b.fecha + (b.hora || ''))); }).slice(-20);
    if (window._rlKc) { try { window._rlKc.destroy(); } catch (e) { } }
    if (!rows.length) { cv.style.display = 'none'; return; }
    cv.style.display = '';
    window._rlKc = new Chart(cv, {
      type: 'line',
      data: {
        labels: rows.map(function (a) { return fdate(a.fecha) + ' ' + (a.hora || ''); }),
        datasets: [
          { label: 'TA sist.', data: rows.map(function (a) { return a.tas || null; }), borderColor: '#ef4444', tension: .3 },
          { label: 'TA diás.', data: rows.map(function (a) { return a.tad || null; }), borderColor: '#f97316', tension: .3 },
          { label: 'FC', data: rows.map(function (a) { return a.fc || null; }), borderColor: '#3b82f6', tension: .3 },
          { label: 'SpO₂', data: rows.map(function (a) { return a.spo2 || null; }), borderColor: '#0f766e', tension: .3 }]
      },
      options: { responsive: true, plugins: { legend: { labels: { boxWidth: 10, font: { size: 10 } } } } }
    });
  }
  kSave = async function () {
    var pid = Number(g$('kPac').value);
    if (!pid) return toast('Crea primero un paciente');
    var p = await dbGet('patients', pid);
    var tas = +g$('kTas').value || null, tad = +g$('kTad').value || null;
    var fc = +g$('kFc').value || null, sp = +g$('kSpo2').value || null, gl = +g$('kGlu').value || null, al = [];
    if (tas !== null) {
      if (tas > 200) al.push('🔴 TAS ' + tas + ' mmHg en reposo: contraindicación absoluta para iniciar. Derivar.');
      else if (tas >= 180 || (tad !== null && tad >= 110)) al.push('🔴 Crisis hipertensiva (' + tas + '/' + (tad || '—') + '): no iniciar sesión.');
      else if (tas >= 160 || (tad !== null && tad >= 100)) al.push('🟠 TA muy elevada (' + tas + '/' + tad + '): contraindicación relativa, reevaluar en 15 min.');
      else if (tas >= 140 || (tad !== null && tad >= 90)) al.push('🟠 TA ≥140/90 (' + tas + '/' + tad + '): precaución durante la sesión.');
      if (tas < 90) al.push('🔴 Hipotensión (' + tas + ' mmHg): no iniciar; valorar medicación y volemia.');
    } else if (tad !== null && tad >= 110) al.push('🔴 Diastólica ≥110 mmHg: valorar antes de la sesión.');
    if (fc !== null) {
      if (fc < 40) al.push('🔴 Bradicardia marcada (' + fc + ' lpm): consultar.');
      else if (fc < 50 && !p.betabloqueante) al.push('🟠 Bradicardia (' + fc + ' lpm) sin betabloqueo declarado.');
      if (fc > 120) al.push('🔴 FC en reposo >120 lpm (' + fc + '): descartar causa aguda.');
      else if (fc > 100) al.push('🟠 Taquicardia en reposo (' + fc + ' lpm).');
    }
    if (sp !== null) {
      if (sp < 90) al.push('🔴 SpO₂ ' + sp + '%: suspender y valorar.');
      else if (sp < 94) al.push('🟠 SpO₂ ' + sp + '%: vigilar desaturación con el esfuerzo.');
    }
    if (gl !== null) {
      if (gl < 70) al.push('🔴 Hipoglucemia (' + gl + ' mg/dL): tratar antes de cualquier actividad.');
      else if (gl < 100) al.push('🟠 Glucemia ' + gl + ' mg/dL: ofrecer carbohidratos antes de la sesión.');
      else if (gl > 300) al.push('🔴 Hiperglucemia (' + gl + ' mg/dL): posponer y valorar cetosis.');
      else if (gl > 250) al.push('🟠 Glucemia ' + gl + ' mg/dL: comprobar cetonas.');
    }
    var rpp = (tas && fc) ? tas * fc : null;
    var a = {
      patientId: pid, pacienteNombre: p.nombre, tipo: 'constantes', fecha: hoy(),
      hora: new Date().toTimeString().slice(0, 5), profesional: state.user.nombre,
      tas: tas, tad: tad, fc: fc, spo2: sp, glucemia: gl, rpp: rpp,
      momento: g$('kMom').value, notas: g$('kNotas').value, alertas: al
    };
    var id = await dbAdd('assessments', a);
    await audit('crear', 'assessment', id, null, { tipo: 'constantes', alertas: al.length });
    g$('kAlert').innerHTML = al.length
      ? al.map(function (x) { return '<p class="text-xs rounded-lg p-2 mb-1 ' + (x.indexOf('🔴') === 0 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800') + '">' + esc(x) + '</p>'; }).join('')
      : '<p class="text-xs bg-green-50 text-green-700 rounded-lg p-2">✅ Constantes dentro de rango' + (rpp ? ' · RPP ' + rpp.toLocaleString('es-ES') : '') + '.</p>';
    toast(al.length ? '⚠️ ' + al.length + ' aviso(s) de seguridad' : 'Constantes guardadas');
    kList(); trend();
  };

  /* =============== PRUEBAS: interpretación por sexo / predicho =============== */
  PRUEBAS.tug.interp = function (v) {
    return v < 10 ? '✅ Normal (<10 s)' : v < 13.5 ? '🟢 Límite (10-13,5 s)'
      : v < 20 ? '🟠 Riesgo de caídas (≥13,5 s)' : '🔴 Movilidad muy comprometida (≥20 s)';
  };
  PRUEBAS.sts30.interp = function (v, ctx) {
    ctx = ctx || ctxPaciente() || {};
    if (!ctx.sexo) return '⚠️ ' + v + ' reps · registra el sexo y la edad del paciente para aplicar la referencia de Jones 2007';
    var ref = stsRef(ctx.sexo, ctx.edad);
    return v >= ref ? '✅ Dentro de lo esperado (ref ≈' + ref + ' reps)'
      : v >= ref - 3 ? '🟠 Por debajo de la referencia (≈' + ref + ')' : '🔴 Muy por debajo de la referencia (≈' + ref + ')';
  };
  PRUEBAS.vel10.interp = function (v) {
    return v >= 1.0 ? '✅ ≥1,0 m/s (independencia funcional)' : v >= 0.8 ? '🟠 0,8-1,0 m/s (descenso)' : '🔴 <0,8 m/s: riesgo de resultados adversos';
  };
  PRUEBAS.prension.interp = function (v, ctx) {
    ctx = ctx || ctxPaciente() || {};
    if (!ctx.sexo) return '⚠️ ' + v + ' kg · falta el sexo del paciente para aplicar el corte EWGSOP2';
    var cut = EWGSOP2[ctx.sexo === 'F' ? 'F' : 'M'];
    return v >= cut ? '✅ ≥' + cut + ' kg (EWGSOP2)' : '🔴 <' + cut + ' kg: baja fuerza de prensión (EWGSOP2)';
  };
  PRUEBAS['6mwt'].interp = function (v, ctx) {
    ctx = ctx || ctxPaciente() || {};
    var pred = pred6mwt(ctx.sexo, ctx.altura, ctx.edad, ctx.peso);
    if (!pred) return '⚠️ ' + v + ' m · sin sexo, altura, edad y peso no se puede calcular el % del predicho';
    var pct = Math.round(v / pred * 100);
    var txt = pct >= 80 ? '✅ Conservado' : pct >= 65 ? '🟠 Leve-moderado' : pct >= 50 ? '🔴 Moderado-grave' : '🔴 Grave';
    return txt + ' · ' + pct + '% del predicho (' + pred + ' m)';
  };
  PRUEBAS.tug.fuente = 'Podsiadlo & Richardson 1991 · cortes Sherrington 2013';
  PRUEBAS['6mwt'].fuente = 'ATS/ERS 2002 · Enright & Sherrill 1998 · MCC 26-33 m';
  PRUEBAS.sts30.fuente = 'Jones et al. Phys Ther 2007 (referencia aproximada por edad/sexo)';
  PRUEBAS.vel10.fuente = 'Studenski et al. JAMA 2011';
  PRUEBAS.prension.fuente = 'Cruz-Jentoft et al. EWGSOP2. Age Ageing 2019';

  var _cPruebas = cPruebas;
  cPruebas = function () {
    _cPruebas();
    safe(function () {
      var card = g$('cardioContent').querySelector('.card');
      if (card) card.insertAdjacentHTML('afterbegin',
        '<div class="rl-banner rev">La interpretación exige <strong>sexo, edad, altura y peso</strong> en la ficha del paciente. Sin ellos el 6MWT no puede expresarse en % del predicho.</div>');
      dbAll('patients').then(function (ps) { RL.pacCache = {}; ps.forEach(function (p) { RL.pacCache[p.id] = p; }); });
    });
  };
  var _pSave = pSave;
  pSave = async function () {
    var pid = Number(g$('pPac').value);
    if (!pid) return toast('Crea primero un paciente');
    var p = await dbGet('patients', pid), tipo = g$('pTipo').value;
    if (tipo === '6mwt' && (!p.sexo || !p.altura || !p.nacimiento || !p.peso))
      if (!(await confirmDlg('Para calcular el <strong>% del predicho</strong> del 6MWT hacen falta sexo, altura, peso y fecha de nacimiento. Se guardará sin ese cálculo. ¿Continuar?', '📐 Datos incompletos'))) return;
    await _pSave();
    safe(async function () {
      var al = (await dbAll('assessments')).filter(function (a) { return a.patientId === pid && a.tipo === 'prueba'; })
        .sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); })[0];
      if (!al) return;
      var ctx = { sexo: p.sexo, edad: edadDe(p.nacimiento), altura: p.altura, peso: p.peso };
      al.ctx = ctx;
      al.interpretacion = PRUEBAS[al.prueba].interp(al.valor, ctx);
      al.fuente = PRUEBAS[al.prueba].fuente || '';
      if (al.prueba === '6mwt') {
        var pr = pred6mwt(p.sexo, p.altura, ctx.edad, p.peso);
        if (pr) { al.predicho = pr; al.pctPredicho = Math.round(al.valor / pr * 100); }
      }
      if (al.prueba === 'sts30') al.referencia = '≈' + stsRef(p.sexo, ctx.edad) + ' reps';
      if (al.prueba === 'prension') al.referencia = '≥' + EWGSOP2[p.sexo === 'F' ? 'F' : 'M'] + ' kg';
      await dbPut('assessments', al);
      var box = g$('pAlert');
      if (box) box.innerHTML = '<p class="text-xs rounded-lg p-2 bg-slate-100">' + esc(al.interpretacion) +
        (al.predicho ? '<br><span class="text-slate-500">Predicho ' + al.predicho + ' m · ' + al.pctPredicho + '% · MCC 26-33 m</span>' : '') +
        (al.referencia ? '<br><span class="text-slate-500">Referencia: ' + esc(String(al.referencia)) + '</span>' : '') +
        (al.fuente ? '<br><span class="text-slate-400">' + esc(al.fuente) + '</span>' : '') + '</p>';
      pList();
    }, 'pSave-ext');
  };

  /* =============== ESCALAS: prorrateo del ODI =============== */
  ESCALAS.berg.interp = function (v) {
    return v >= 50 ? '✅ ' + v + '/56 · equilibrio conservado'
      : v >= 46 ? '🟢 ' + v + '/56 · próximo al corte de riesgo'
      : v >= 21 ? '🟠 ' + v + '/56 · ≤45 indica riesgo de caídas'
        : '🔴 ' + v + '/56 · dependencia en actividades de la escala';
  };
  ESCALAS.mrc.interp = function (v) {
    return v <= 1 ? '✅ mMRC ' + v + ' · disnea leve' : v === 2 ? '🟠 mMRC ' + v + ' · limitante' : '🔴 mMRC ' + v + ' · disnea importante';
  };
  var _eFields = eFields;
  eFields = function () {
    _eFields();
    safe(function () {
      if (g$('eTipo').value !== 'oswestry') return;
      for (var i = 0; i < ESCALAS.oswestry.items.length; i++) {
        var s = g$('eI' + i); if (!s) continue;
        var o = document.createElement('option'); o.value = 'NA'; o.textContent = 'N/C'; s.appendChild(o);
      }
      var box = g$('eFieldsBox');
      if (box) box.insertAdjacentHTML('beforeend',
        '<p class="text-[11px] text-slate-500 mt-2">Los items <strong>N/C</strong> se excluyen y el índice se prorratea sobre los contestados (regla oficial del ODI).</p>');
    });
  };
  var _eSave = eSave;
  eSave = async function () {
    if (g$('eTipo').value !== 'oswestry') return _eSave();
    var pid = Number(g$('ePac').value);
    if (!pid) return toast('Crea primero un paciente');
    var items = ESCALAS.oswestry.items, suma = 0, n = 0;
    for (var i = 0; i < items.length; i++) {
      var s = g$('eI' + i); if (!s) continue;
      if (s.value === 'NA') continue;
      suma += (+s.value || 0); n++;
    }
    if (!n) return toast('Responde al menos un item');
    var pct = Math.round(suma / (n * 5) * 100);
    var interp = pct < 20 ? '✅ Discapacidad mínima' : pct < 40 ? '🟠 Moderada' : pct < 60 ? '🔴 Severa' : '🔴 Extrema / falsa';
    var p = await dbGet('patients', pid);
    var a = {
      patientId: pid, pacienteNombre: p.nombre, tipo: 'escala', escala: 'oswestry',
      escalaNombre: 'Oswestry (prorrateado)', puntuacion: pct, max: 100,
      itemsContestados: n, itemsTotales: items.length,
      interpretacion: interp + ' · ' + n + '/' + items.length + ' items',
      fuente: 'Fairbank 1983 · MCC ≈10 ptos (Ostelo 2008)',
      fecha: hoy(), profesional: state.user.nombre, articulacion: 'Escala', movimiento: 'ODI', grados: pct
    };
    var id = await dbAdd('assessments', a);
    await audit('crear', 'assessment', id, null, { tipo: 'escala', escala: 'oswestry', pct: pct, items: n });
    g$('eAlert').innerHTML = '<p class="text-xs rounded-lg p-2 bg-slate-100"><strong>' + pct + '%</strong> → ' + interp +
      '<br><span class="text-slate-500">' + n + ' de ' + items.length + ' items contestados · ' + a.fuente + '</span></p>';
    toast('Escala guardada (ODI prorrateado)'); eList();
  };
  var _cEscalas = cEscalas;
  cEscalas = function () {
    _cEscalas();
    safe(function () {
      var card = g$('cardioContent').querySelector('.card');
      if (card) card.insertAdjacentHTML('afterbegin',
        '<div class="rl-banner info">Cortes: Berg ≤45/56 riesgo de caídas · ODI MCC ≈10 ptos · mMRC ≥2 limitante. El ODI prorrotea los items no contestados.</div>');
    });
  };

  /* =============== SEGURIDAD: checklist sin ambigüedad =============== */
  safe(function () {
    for (var i = 0; i < STOP_CRITERIA.length; i++)
      if (/Borg/i.test(STOP_CRITERIA[i]))
        STOP_CRITERIA[i] = 'Esfuerzo percibido ≥8-9 en Borg CR10 (≈16-17 en Borg 6-20) o incapacidad para hablar';
    if (!STOP_CRITERIA.some(function (c) { return /SpO/.test(c); }))
      STOP_CRITERIA.push('Descenso de SpO₂ ≥10 puntos porcentuales o <90 %');
    if (!STOP_CRITERIA.some(function (c) { return /arritm/i.test(c); }))
      STOP_CRITERIA.push('Arritmias nuevas, alteraciones del ECG o descenso de ST');
  }, 'stop-criteria');

  /* =============== ATLAS: trazabilidad =============== */
  safe(function () {
    TESTS.forEach(function (t) {
      if (!t.fuente) t.fuente = 'Técnica estándar de exploración (Magee / Physiopedia). Verificar sensibilidad y especificidad antes de usarla como criterio diagnóstico.';
    });
    TRP.forEach(function (p) { if (!p.fuente) p.fuente = 'Travell & Simons. Myofascial Pain and Dysfunction: The Trigger Point Manual.'; });
  }, 'atlas-fuentes');

  /* =============== RGPD: exportación cifrada e importación segura =============== */
  exportData = async function (cifrar) {
    var dump = { app: 'Re-Late', version: APP_VERSION, exported: new Date().toISOString(), capa: V, data: {} };
    var vids = 0;
    for (var i = 0; i < STORES.length; i++) {
      var s = STORES[i], rows = await dbAll(s);
      if (s === 'videos') {
        vids = rows.filter(function (r) { return r.tipo === 'archivo'; }).length;
        dump.data[s] = rows.map(function (r) { return r.tipo === 'archivo' ? Object.assign({}, r, { blob: null, _blobOmitido: true }) : r; });
      } else dump.data[s] = rows;
    }
    var texto = JSON.stringify(dump, null, 2), nombre = 'relate-backup-' + hoy() + '.json';
    if (cifrar) {
      var pass = await askDlg('Frase para cifrar la copia (AES-256-GCM). <strong>Sin esta frase la copia es ilegible.</strong>', '🔐 Copia cifrada', '', 'password');
      if (!pass) return;
      if (pass.length < 8) return toast('La frase debe tener al menos 8 caracteres');
      var salt = b64(crypto.getRandomValues(new Uint8Array(16)));
      var key = await deriveKey(pass, salt);
      var iv = crypto.getRandomValues(new Uint8Array(12));
      var ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, new TextEncoder().encode(texto));
      texto = JSON.stringify({ app: 'Re-Late-enc', version: APP_VERSION, exported: dump.exported, salt: salt, iv: b64(iv), cipher: 'AES-256-GCM/PBKDF2-SHA256-600000', data_b64: b64(ct) }, null, 2);
      nombre = 'relate-backup-' + hoy() + '.crypt.json';
    } else {
      if (!(await confirmDlg('La copia se exportará <strong>sin cifrar</strong>: contendrá datos de salud en texto plano. Guárdala solo en equipo cifrado y no la envíes por correo. ¿Continuar?', '📄 Exportación en claro')))
        return exportData(true);
    }
    var blob = new Blob([texto], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = nombre; a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
    await audit('exportar', 'backup', null, null, { fecha: hoy(), cifrado: !!cifrar, videosOmitidos: vids });
    toast(cifrar ? '🔐 Copia cifrada exportada' : 'Copia exportada');
  };
  var _importData = importData;
  importData = async function (ev) {
    var f = ev.target.files[0]; if (!f) return;
    ev.target.value = '';
    var probe; try { probe = JSON.parse(await f.text()); } catch (e) { return toast('El archivo no es un JSON válido'); }
    if (probe.app === 'Re-Late-enc') {
      var pass = await askDlg('Esta copia está cifrada. Introduce la frase con la que se exportó:', '🔐 Descifrar copia', '', 'password');
      if (!pass) return;
      try {
        var key = await deriveKey(pass, probe.salt);
        var pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(probe.iv) }, key, unb64(probe.data_b64));
        probe = JSON.parse(new TextDecoder().decode(pt));
      } catch (e) { return toast('🔴 Frase incorrecta: copia no importada'); }
    }
    if (!(await confirmDlg('Se creará una copia de seguridad automática ANTES de importar. ¿Continuar?', '💾 Importar datos'))) return;
    await exportData(true);
    var n = 0;
    for (var i = 0; i < STORES.length; i++) {
      var s = STORES[i];
      if (!Array.isArray((probe.data || {})[s])) continue;
      for (var j = 0; j < probe.data[s].length; j++) { await dbPut(s, probe.data[s][j]); n++; }
    }
    await audit('importar', 'backup', null, null, { archivo: f.name, registros: n });
    toast('✅ ' + n + ' registros importados (copia previa creada)'); render();
  };
  var _viewAudit = viewAudit;
  viewAudit = async function () {
    await _viewAudit();
    safe(function () {
      var v = g$('view'); if (!v) return;
      var bar = el('div'); bar.className = 'flex flex-wrap gap-2 mb-3';
      bar.innerHTML = '<input id="rlAuditQ" placeholder="🔍 Filtrar por usuario, acción o entidad..." class="flex-1 min-w-[220px] p-2 border rounded-lg text-sm">' +
        '<button id="rlCsv" class="bg-slate-200 px-3 py-2 rounded-lg text-sm font-semibold">⬇ CSV</button>';
      var card = v.querySelector('.card'); if (card) v.insertBefore(bar, card);
      g$('rlAuditQ').addEventListener('input', function () {
        var q = norm(this.value);
        v.querySelectorAll('tbody tr').forEach(function (tr) {
          tr.style.display = (!q || norm(tr.textContent).indexOf(q) !== -1) ? '' : 'none';
        });
      });
      g$('rlCsv').addEventListener('click', function () {
        dbAll('audit').then(function (logs) {
          var csv = 'fecha,usuario,rol,accion,entidad,entidadId\n' + logs.map(function (l) {
            return [l.fecha, l.usuario, l.rol, l.accion, l.entidad, l.entidadId]
              .map(function (x) { return '"' + String(x == null ? '' : x).replace(/"/g, '""') + '"'; }).join(',');
          }).join('\n');
          var b = new Blob([csv], { type: 'text/csv;charset=utf-8' });
          var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'auditoria-relate-' + hoy() + '.csv'; a.click();
          toast('Auditoría exportada en CSV');
        });
      });
    }, 'audit-ext');
  };

  /* =============== BANNERS + postRender + impresión =============== */
  var BANNERS = {
    cardio: ['rev', 'Módulo cardiometabólico: las fórmulas de FCmáx son <strong>estimaciones poblacionales</strong>. La prescripción definitiva requiere prueba de esfuerzo y criterio del cardiólogo.'],
    atlas: ['rev', 'Atlas de consulta (Travell &amp; Simons; Magee; Physiopedia). <strong>No sustituye</strong> la palpación ni el juicio clínico: verifica la fiabilidad de cada test antes de usarlo como criterio diagnóstico.'],
    assessment: ['info', 'Goniometría de pantalla: la fiabilidad inter-evaluador es de 2-5°. Estandariza posición cero, estabilización proximal y registra el lado dominante.'],
    videos: ['rev', 'Los vídeos <strong>no se cifran</strong> (rendimiento) y exigen consentimiento de imagen firmado. La custodia del equipo es responsabilidad del titular.'],
    consents: ['info', 'Cada consentimiento guarda plantilla, versión y hash SHA-256 del texto. El hash acredita integridad, no la identidad del firmante.']
  };
  function trapFocus(root) {
    if (root.dataset.rlTrap) return;
    root.dataset.rlTrap = '1';
    root.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var f = root.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }
  function post() {
    var v = g$('view'); if (!v) return;
    var b = BANNERS[state.view];
    if (b && !v.querySelector('.rl-banner')) v.insertAdjacentHTML('afterbegin', '<div class="rl-banner ' + b[0] + '">' + b[1] + '</div>');
        var foot = document.querySelector('#app footer');
    if (foot && !foot.dataset.rlStamp) {
      foot.dataset.rlStamp = '1';
      foot.insertAdjacentHTML('beforeend',
        '<br><span class="text-[10px]">app v' + APP_VERSION + ' · capa ' + V +
        ' · <span id="rlNet">' + (navigator.onLine ? 'online' : 'offline') + '</span></span>');
    }

    v.querySelectorAll('button,a[href]').forEach(function (n) {
      if (!(n.textContent || '').trim() && !n.getAttribute('aria-label') && !n.getAttribute('title')) n.setAttribute('aria-label', 'Control sin etiqueta');
    });
    var m = g$('modal'); if (m && !m.classList.contains('hidden')) trapFocus(m);
       var n2 = g$('netStatus');
    if (n2) { var t = navigator.onLine ? '● online' : '● offline'; if (n2.textContent !== t) n2.textContent = t; }

  }
  RL.post = post;

  /* =============== RANGOS FISIOLÓGICOS =============== */
  var RANGOS = [
    { k: ['spo2', 'saturacion'], min: 50, max: 100, nota: 'SpO₂ 50-100 %' },
    { k: ['glucemia', 'glucosa'], min: 20, max: 800, nota: 'Glucemia 20-800 mg/dL' },
    { k: ['sistolica'], min: 40, max: 300, nota: 'Sistólica 40-300 mmHg' },
    { k: ['diastolica'], min: 20, max: 200, nota: 'Diastólica 20-200 mmHg' },
    { k: ['frecuencia cardiaca', 'lpm', 'fc reposo', 'fc maxima', 'fc ('], min: 20, max: 260, nota: 'FC 20-260 lpm' },
    { k: ['eva'], min: 0, max: 10, nota: 'EVA 0-10' },
    { k: ['borg'], min: 0, max: 20, nota: 'Borg CR10 0-10 (6-20 en la clásica)' },
    { k: ['grados', 'goniometro'], min: -30, max: 220, nota: 'ROM 0-220°' },
    { k: ['altura'], min: 80, max: 250, nota: 'Altura 80-250 cm' },
    { k: ['peso'], min: 20, max: 300, nota: 'Peso 20-300 kg' }
  ];
  function contexto(input) {
    var partes = [];
    if (input.labels && input.labels[0]) partes.push(input.labels[0].textContent);
    partes.push(input.getAttribute('aria-label') || '', input.getAttribute('name') || '', input.id || '', input.placeholder || '');
    var n = input;
    for (var i = 0; i < 4 && n; i++) { n = n.parentElement; if (n) partes.push(n.textContent || ''); }
    return norm(partes.join(' ')).slice(0, 500);
  }
  function validar(input) {
    safe(function () {
      var prev = input.parentNode && input.parentNode.querySelector('.rl-flag');
      if (prev) prev.parentNode.removeChild(prev);
      var num = parseFloat(String(input.value || '').replace(',', '.'));
      if (isNaN(num) || !input.value) return;
      var ctx = contexto(input);
      for (var i = 0; i < RANGOS.length; i++) {
        if (!RANGOS[i].k.some(function (k) { return ctx.indexOf(k) !== -1; })) continue;
        if (num < RANGOS[i].min || num > RANGOS[i].max) {
          var b = el('span', 'rl-flag', 'fuera de rango · ' + RANGOS[i].nota);
          b.title = 'Valor fisiológicamente improbable: revisa la medición o la unidad.';
          input.parentNode.insertBefore(b, input.nextSibling);
        }
        return;
      }
    }, 'validar');
  }
  document.addEventListener('input', function (e) { if (e.target && e.target.matches && e.target.matches('input')) validar(e.target); }, true);
  document.addEventListener('change', function (e) { if (e.target && e.target.matches && e.target.matches('input,select')) validar(e.target); }, true);

  /* =============== ROUTING POR HASH (atajos del manifest) =============== */
  var VIEWS = ['dashboard', 'patients', 'agenda', 'assessment', 'exercises', 'routines', 'adherence', 'bonos', 'consents', 'videos', 'chat', 'atlas', 'cardio', 'audit', 'settings'];
  var _go = go;
  go = function (v) {
    _go(v);
    safe(function () { if (location.hash !== '#' + state.view) history.replaceState(null, '', '#' + state.view); });
  };
  window.go = go;
  function syncHash() {
    var h = (location.hash || '').replace('#', '');
    if (h && VIEWS.indexOf(h) !== -1 && state.user && h !== state.view) safe(function () { go(h); });
  }
  window.addEventListener('hashchange', syncHash);
  setTimeout(syncHash, 1200);

  /* =============== IMPRESIÓN =============== */
  function printHead() {
    safe(function () {
      if (!g$('rl-print-head')) {
        var h = el('div'); h.id = 'rl-print-head';
        h.innerHTML = '<strong>Re-Late · Fisioterapia</strong> — documento clínico · app v' + APP_VERSION + ' · capa ' + V +
          '<br>Generado el ' + new Date().toLocaleString('es-ES') + ' · Profesional: ' + esc((state.user && state.user.nombre) || '—') +
          ' · Paciente: ' + esc((state.currentPatient && state.currentPatient.nombre) || (pp.patient && pp.patient.nombre) || '—') +
          '<br><em>Herramienta de apoyo. No sustituye el juicio clínico. Datos de demostración si procede.</em>';
        document.body.appendChild(h);
      }
      if (!g$('rl-print-foot')) {
        var f = el('div'); f.id = 'rl-print-foot';
        f.textContent = 'Documento generado localmente en el navegador. Confidencial — tratamiento conforme al RGPD (UE) 2016/679.';
        document.body.appendChild(f);
      }
    }, 'print');
  }
  window.addEventListener('beforeprint', printHead);

  /* =============== TECLADO + ESTADO =============== */
  function estado() {
    var txt = norm(document.body.textContent || '');
    var filas = [
      ['Capa de mejoras', 'v' + V],
      ['Protocolo', location.protocol === 'file:' ? 'file:// restringido' : 'servidor HTTP/HTTPS', location.protocol === 'file:' ? 'no' : 'ok'],
      ['Contexto seguro', isSecureContext ? 'sí' : 'no', isSecureContext ? 'ok' : 'mid'],
      ['Web Crypto (AES-GCM)', window.crypto && crypto.subtle ? 'disponible' : 'no disponible', window.crypto && crypto.subtle ? 'ok' : 'no'],
      ['Base de datos', (typeof useLS !== 'undefined' && useLS) ? 'LocalStorage (degradado)' : 'IndexedDB relate_db v5', (typeof useLS !== 'undefined' && useLS) ? 'mid' : 'ok'],
      ['Cifrado en reposo', localStorage.getItem('relate_crypto') === '1' ? 'activo' : 'desactivado', 'mid'],
      ['Service worker', 'serviceWorker' in navigator ? 'soportado' : 'no soportado', 'serviceWorker' in navigator ? 'ok' : 'no'],
      ['Conexión', navigator.onLine ? 'online' : 'offline', navigator.onLine ? 'ok' : 'mid'],
      ['Tailwind local', !!document.querySelector('script[src*="vendor/tailwind"]') ? 'sí' : 'CDN (requiere internet)', 'mid'],
      ['Chart.js local', !!document.querySelector('script[src*="vendor/chart"]') ? 'sí' : 'CDN (requiere internet)', 'mid'],
      ['Errores capturados', String(RL.errores.length), RL.errores.length ? 'no' : 'ok']
    ];
    [['valoración', 'Valoración'], ['atlas', 'Atlas'], ['cardiometab', 'Cardiometabólico'], ['goni', 'Goniómetro']].forEach(function (m) {
      filas.push(['Módulo ' + m[1], txt.indexOf(m[0]) !== -1 ? 'visible' : 'no visible ahora', txt.indexOf(m[0]) !== -1 ? 'ok' : 'mid']);
    });
    if (RL.errores.length) filas.push(['Último error', RL.errores[RL.errores.length - 1].ctx + ': ' + RL.errores[RL.errores.length - 1].msg, 'no']);
    abrirPanel('Re-Late · estado técnico', filas);
  }
  document.addEventListener('keydown', function (ev) {
    if (!ev.altKey) return;
    var c = (ev.key || '').toLowerCase();
    if (c === 'm') { ev.preventDefault(); estado(); }
    else if (c === 'e') { ev.preventDefault(); exportData(true); }
    else if (c === 'p') { ev.preventDefault(); printHead(); window.print(); }
  });

  /* =============== ARRANQUE =============== */
  safe(function () {
    var mo = new MutationObserver(function () { clearTimeout(mo._t); mo._t = setTimeout(post, 250); });
    mo.observe(document.body, { childList: true, subtree: true });
  });
  if (location.protocol === 'file:')
    rtoast('Abierta con file://: IndexedDB y el service worker pueden estar restringidos. Súbela a GitHub Pages o sírvela con un servidor local.', 'danger', 14000);
  window.addEventListener('offline', function () { rtoast('Sin conexión: la capa sirve los recursos locales.', 'warn', 7000); });
  window.addEventListener('online', function () { rtoast('Conexión recuperada.', 'ok', 3000); });

  RL.anadirEvidencia = function (i) { if (i && i.k && i.t) RL.EVIDENCIA.push(i); };
  RL.estado = estado;
  console.info('%cRe-Late · capa v' + V + ' (parte 2) activa', 'color:#0f766e;font-weight:bold');
})();
/* ---- corrección 6MWT: ecuaciones de Enright & Sherrill (AJRCCM 1998) ---- */
window.pred6mwt = function (p, a) {
  var h = +p.altura || 0, w = +p.peso || 0, ed = a;
  if (ed == null && p.fechaNacimiento) {
    var b = new Date(p.fechaNacimiento);
    if (!isNaN(b.getTime())) {
      var t = new Date();
      ed = t.getFullYear() - b.getFullYear();
      if (t.getMonth() < b.getMonth() ||
         (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) ed--;
    }
  }
  if (!h || !ed) return null;
  return Math.round(p.genero === 'F'
    ? (2.11 * h) - (2.29 * w) - (5.78 * ed) + 667
    : (7.57 * h) - (5.02 * ed) - (1.76 * w) - 309);
};
if (window.RELATE) window.RELATE.pred6mwt = window.pred6mwt;
