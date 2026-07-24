// ============================================================
// MAPA DE PROCESSOS - com hierarquia pai/filho
// ============================================================
var processosRef = db.ref('processos');
var processos = {};
var editingProcessoId = null;
var processosListener = null;
var collapsedProcessos = {};

var PROC_NODE_W = 180;
var PROC_NODE_H_BASE = 60;
var PROC_H_GAP = 30;
var PROC_V_GAP = 60;

function startProcessosListener() {
    if (processosListener) return;
    processosListener = processosRef.on('value', function(snapshot) {
        var val = snapshot.val();
        if (val) {
            processos = val;
        } else {
            processos = {};
        }
        renderProcessos();
    }, function(error) {
        console.error('Processos listener error:', error);
    });
}

function stopProcessosListener() {
    if (processosListener) {
        processosRef.off('value', processosListener);
        processosListener = null;
    }
}

// Helpers
function getProcChildren(parentId) {
    var children = [];
    var keys = Object.keys(processos);
    for (var i = 0; i < keys.length; i++) {
        if (processos[keys[i]].parent === parentId) {
            children.push(keys[i]);
        }
    }
    children.sort(function(a, b) {
        return (processos[a].order || 0) - (processos[b].order || 0);
    });
    return children;
}

function procSubtreeWidth(id) {
    var children = getProcChildren(id);
    if (children.length === 0 || collapsedProcessos[id]) return PROC_NODE_W;
    var total = 0;
    for (var i = 0; i < children.length; i++) {
        if (i > 0) total += PROC_H_GAP;
        total += procSubtreeWidth(children[i]);
    }
    return Math.max(PROC_NODE_W, total);
}

function estimateProcHeight(id) {
    var proc = processos[id];
    var h = PROC_NODE_H_BASE;
    if (proc.links && proc.links.length > 0) {
        h += Math.min(proc.links.length, 4) * 16 + 8;
    }
    return h;
}

// ============================================================
// RENDER PROCESSOS (arvore visual)
// ============================================================
function renderProcessos() {
    var container = document.getElementById('processosContainer');
    var svg = document.getElementById('processosSvg');
    var inner = document.getElementById('processosInner');
    if (!container || !svg || !inner) return;

    container.innerHTML = '';
    svg.innerHTML = '';

    var keys = Object.keys(processos);
    if (keys.length === 0) {
        container.innerHTML = '<p style="color:#888;text-align:center;padding:60px;">Nenhum processo cadastrado.</p>';
        return;
    }

    // Encontrar raizes
    var roots = [];
    for (var i = 0; i < keys.length; i++) {
        if (!processos[keys[i]].parent || processos[keys[i]].parent === '') {
            roots.push(keys[i]);
        }
    }
    if (roots.length === 0) {
        // Fallback: mostrar todos como raiz
        roots = keys.slice();
    }

    var positions = {};
    var nodeHeights = {};

    function layout(id, x, y) {
        var h = estimateProcHeight(id);
        nodeHeights[id] = h;
        var children = getProcChildren(id);

        if (children.length === 0 || collapsedProcessos[id]) {
            positions[id] = { x: x, y: y, w: PROC_NODE_W, h: h };
            return PROC_NODE_W;
        }

        var totalChildW = 0;
        var childWidths = [];
        for (var i = 0; i < children.length; i++) {
            var cw = procSubtreeWidth(children[i]);
            childWidths.push(cw);
            totalChildW += cw;
            if (i > 0) totalChildW += PROC_H_GAP;
        }

        var nodeX = x + totalChildW / 2 - PROC_NODE_W / 2;
        positions[id] = { x: nodeX, y: y, w: PROC_NODE_W, h: h };

        var childY = y + h + PROC_V_GAP;
        var cx = x;
        for (var i = 0; i < children.length; i++) {
            layout(children[i], cx, childY);
            cx += childWidths[i] + PROC_H_GAP;
        }
        return totalChildW;
    }

    var startX = 20;
    for (var i = 0; i < roots.length; i++) {
        var rw = procSubtreeWidth(roots[i]);
        layout(roots[i], startX, 20);
        startX += rw + PROC_H_GAP * 2;
    }

    // Dimensoes
    var maxX = 0, maxY = 0;
    var posKeys = Object.keys(positions);
    for (var i = 0; i < posKeys.length; i++) {
        var p = positions[posKeys[i]];
        if (p.x + p.w > maxX) maxX = p.x + p.w;
        if (p.y + p.h > maxY) maxY = p.y + p.h;
    }

    var chartW = maxX + 40;
    var chartH = maxY + 40;
    inner.style.width = chartW + 'px';
    inner.style.height = chartH + 'px';
    svg.setAttribute('width', chartW);
    svg.setAttribute('height', chartH);
    svg.style.width = chartW + 'px';
    svg.style.height = chartH + 'px';

    // Renderizar nos
    for (var i = 0; i < keys.length; i++) {
        var id = keys[i];
        var proc = processos[id];
        var pos = positions[id];
        if (!pos) continue;

        var children = getProcChildren(id);
        var hasChildren = children.length > 0;
        var isCollapsed = !!collapsedProcessos[id];
        var isRoot = !proc.parent || proc.parent === '';

        var div = document.createElement('div');
        div.className = 'proc-node';
        if (isRoot) div.className += ' is-root';
        if (!hasChildren) div.className += ' is-leaf';
        if (isCollapsed) div.className += ' is-collapsed';

        div.style.borderLeftColor = proc.color || '#3498db';
        div.style.left = pos.x + 'px';
        div.style.top = pos.y + 'px';
        div.style.width = pos.w + 'px';
        div.setAttribute('data-id', id);

        var html = '<span class="proc-edit" data-id="' + id + '">&#9998;</span>';
        html += '<div class="proc-title">' + proc.name + '</div>';
        if (proc.owner) html += '<div class="proc-owner">&#128100; ' + proc.owner + '</div>';

        if (proc.links && proc.links.length > 0) {
            html += '<div class="proc-links">';
            var showLinks = proc.links.slice(0, 4);
            for (var j = 0; j < showLinks.length; j++) {
                if (showLinks[j] && showLinks[j].label) {
                    html += '<a href="' + (showLinks[j].url || '#') + '" target="_blank">' + showLinks[j].label + '</a>';
                }
            }
            if (proc.links.length > 4) html += '<span class="proc-more">+' + (proc.links.length - 4) + ' mais</span>';
            html += '</div>';
        }

        if (hasChildren) {
            var toggleLabel = isCollapsed ? '+' : '\u2212';
            html += '<span class="proc-toggle" data-toggle-id="' + id + '">' + toggleLabel + '</span>';
        }

        div.innerHTML = html;
        div.addEventListener('click', onProcNodeClick);
        container.appendChild(div);
    }

    // Conectores
    for (var i = 0; i < keys.length; i++) {
        var id = keys[i];
        var proc = processos[id];
        if (!proc.parent || proc.parent === '') continue;
        if (collapsedProcessos[proc.parent]) continue;
        var parentPos = positions[proc.parent];
        var childPos = positions[id];
        if (!parentPos || !childPos) continue;

        var parentH = nodeHeights[proc.parent] || PROC_NODE_H_BASE;
        var x1 = parentPos.x + parentPos.w / 2;
        var y1 = parentPos.y + parentH;
        var x2 = childPos.x + childPos.w / 2;
        var y2 = childPos.y;
        var midY = y1 + (y2 - y1) / 2;

        procAppendLine(svg, x1, y1, x1, midY);
        procAppendLine(svg, x1, midY, x2, midY);
        procAppendLine(svg, x2, midY, x2, y2);
    }
}

function procAppendLine(svg, x1, y1, x2, y2) {
    var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    svg.appendChild(line);
}

function onProcNodeClick(e) {
    var target = e.target;
    if (target.classList.contains('proc-edit')) {
        openProcessoForm(target.getAttribute('data-id'));
        return;
    }
    if (target.classList.contains('proc-toggle')) {
        var toggleId = target.getAttribute('data-toggle-id');
        if (collapsedProcessos[toggleId]) {
            delete collapsedProcessos[toggleId];
        } else {
            collapsedProcessos[toggleId] = true;
        }
        renderProcessos();
        return;
    }
    // Ignorar cliques em links
    if (target.tagName === 'A') return;
}

// ============================================================
// FORMULARIO DE PROCESSOS
// ============================================================
function openProcessoForm(id) {
    editingProcessoId = id || null;
    var deleteBtn = document.getElementById('btnDeleteProcesso');

    if (id && processos[id]) {
        var proc = processos[id];
        document.getElementById('processoFormTitle').textContent = 'Editar: ' + proc.name;
        document.getElementById('processoFormId').value = id;
        document.getElementById('processoFormName').value = proc.name || '';
        document.getElementById('processoFormParent').value = proc.parent || '';
        document.getElementById('processoFormOwner').value = proc.owner || '';
        document.getElementById('processoFormColor').value = proc.color || '#3498db';
        var linksText = '';
        if (proc.links) {
            for (var i = 0; i < proc.links.length; i++) {
                if (proc.links[i] && proc.links[i].label) {
                    linksText += proc.links[i].label + ' | ' + (proc.links[i].url || '#') + '\n';
                }
            }
        }
        document.getElementById('processoFormLinks').value = linksText.trim();
        deleteBtn.style.display = 'inline-block';
    } else {
        document.getElementById('processoFormTitle').textContent = 'Novo Processo';
        document.getElementById('processoForm').reset();
        document.getElementById('processoFormId').value = '';
        document.getElementById('processoFormColor').value = '#3498db';
        deleteBtn.style.display = 'none';
    }

    updateProcessoParentSelect();
    document.getElementById('processoFormOverlay').classList.add('active');
}

function updateProcessoParentSelect() {
    var select = document.getElementById('processoFormParent');
    var currentVal = select.value;
    select.innerHTML = '<option value="">(Nenhum - nivel raiz)</option>';
    var keys = Object.keys(processos);
    keys.sort(function(a, b) { return (processos[a].order || 0) - (processos[b].order || 0); });
    for (var i = 0; i < keys.length; i++) {
        if (keys[i] === editingProcessoId) continue;
        var opt = document.createElement('option');
        opt.value = keys[i];
        opt.textContent = processos[keys[i]].name;
        select.appendChild(opt);
    }
    select.value = currentVal;
}

// Salvar processo
document.getElementById('processoForm').addEventListener('submit', function(e) {
    e.preventDefault();
    var id = document.getElementById('processoFormId').value;
    var name = document.getElementById('processoFormName').value.trim();
    var parent = document.getElementById('processoFormParent').value;
    var owner = document.getElementById('processoFormOwner').value.trim();
    var color = document.getElementById('processoFormColor').value;
    var linksText = document.getElementById('processoFormLinks').value;
    var linksLines = linksText.split('\n').filter(function(l) { return l.trim() !== ''; });
    var links = linksLines.map(function(line) {
        var parts = line.split('|');
        return { label: (parts[0] || '').trim(), url: (parts[1] || '#').trim() };
    });

    var data = { name: name, parent: parent, owner: owner, color: color, links: links, order: 0 };

    if (id) {
        data.order = (processos[id] && processos[id].order) || 0;
        processosRef.child(id).set(data).then(function() {
            document.getElementById('processoFormOverlay').classList.remove('active');
        }).catch(function(err) { alert('Erro ao salvar: ' + err.message); });
    } else {
        var newId = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        if (!newId) newId = 'processo-' + Date.now().toString(36);
        if (processos[newId]) newId = newId + '-' + Date.now().toString(36);
        data.order = Object.keys(processos).length;
        processosRef.child(newId).set(data).then(function() {
            document.getElementById('processoFormOverlay').classList.remove('active');
        }).catch(function(err) { alert('Erro ao salvar: ' + err.message); });
    }
});

// Excluir processo
document.getElementById('btnDeleteProcesso').addEventListener('click', function() {
    if (!editingProcessoId) return;
    var name = processos[editingProcessoId] ? processos[editingProcessoId].name : '';
    if (confirm('Excluir "' + name + '"? Filhos ficarao sem pai.')) {
        var children = getProcChildren(editingProcessoId);
        for (var i = 0; i < children.length; i++) {
            processosRef.child(children[i]).child('parent').set('');
        }
        processosRef.child(editingProcessoId).remove();
        document.getElementById('processoFormOverlay').classList.remove('active');
    }
});

document.getElementById('btnCloseProcessoForm').addEventListener('click', function() {
    document.getElementById('processoFormOverlay').classList.remove('active');
});
document.getElementById('processoFormOverlay').addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('active');
});
document.getElementById('btnAddProcesso').addEventListener('click', function() {
    openProcessoForm(null);
});
