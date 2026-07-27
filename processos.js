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
var PROC_H_GAP = 50;  // gap horizontal entre pai e filhos
var PROC_V_GAP = 20;  // gap vertical entre irmaos

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

function procSubtreeHeight(id) {
    var children = getProcChildren(id);
    if (children.length === 0 || collapsedProcessos[id]) return estimateProcHeight(id);
    var total = 0;
    for (var i = 0; i < children.length; i++) {
        if (i > 0) total += PROC_V_GAP;
        total += procSubtreeHeight(children[i]);
    }
    return Math.max(estimateProcHeight(id), total);
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
// RENDER PROCESSOS (arvore horizontal: esquerda -> direita)
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
        roots = keys.slice();
    }
    roots.sort(function(a, b) { return (processos[a].order || 0) - (processos[b].order || 0); });

    var positions = {};
    var nodeHeights = {};

    // Layout horizontal: x cresce pra direita, y empilha filhos verticalmente
    function layout(id, x, y) {
        var h = estimateProcHeight(id);
        nodeHeights[id] = h;
        var children = getProcChildren(id);

        if (children.length === 0 || collapsedProcessos[id]) {
            positions[id] = { x: x, y: y, w: PROC_NODE_W, h: h };
            return h;
        }

        // Calcular altura total dos filhos
        var totalChildH = 0;
        var childHeights = [];
        for (var i = 0; i < children.length; i++) {
            var ch = procSubtreeHeight(children[i]);
            childHeights.push(ch);
            totalChildH += ch;
            if (i > 0) totalChildH += PROC_V_GAP;
        }

        // Posicionar o pai centrado verticalmente em relacao aos filhos
        var parentY = y + totalChildH / 2 - h / 2;
        positions[id] = { x: x, y: parentY, w: PROC_NODE_W, h: h };

        // Posicionar filhos a direita
        var childX = x + PROC_NODE_W + PROC_H_GAP;
        var cy = y;
        for (var i = 0; i < children.length; i++) {
            layout(children[i], childX, cy);
            cy += childHeights[i] + PROC_V_GAP;
        }

        return totalChildH;
    }

    // Layout raizes empilhadas verticalmente
    var startY = 20;
    for (var i = 0; i < roots.length; i++) {
        var rh = procSubtreeHeight(roots[i]);
        layout(roots[i], 20, startY);
        startY += rh + PROC_V_GAP * 2;
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

        // Toggle a direita do no (horizontal)
        if (hasChildren) {
            var toggleLabel = isCollapsed ? '&#9654;' : '&#9664;';
            html += '<span class="proc-toggle proc-toggle-h" data-toggle-id="' + id + '">' + toggleLabel + '</span>';
        }

        div.innerHTML = html;
        div.addEventListener('mousedown', onProcDragStart);
        div.addEventListener('touchstart', onProcDragStart, { passive: false });
        container.appendChild(div);
    }

    // Conectores horizontais (pai -> filhos)
    for (var i = 0; i < keys.length; i++) {
        var id = keys[i];
        var proc = processos[id];
        if (!proc.parent || proc.parent === '') continue;
        if (collapsedProcessos[proc.parent]) continue;
        var parentPos = positions[proc.parent];
        var childPos = positions[id];
        if (!parentPos || !childPos) continue;

        // Saida: centro-direita do pai
        var x1 = parentPos.x + parentPos.w;
        var y1 = parentPos.y + (nodeHeights[proc.parent] || PROC_NODE_H_BASE) / 2;
        // Entrada: centro-esquerda do filho
        var x2 = childPos.x;
        var y2 = childPos.y + (nodeHeights[id] || PROC_NODE_H_BASE) / 2;
        // Ponto medio horizontal
        var midX = x1 + (x2 - x1) / 2;

        procAppendLine(svg, x1, y1, midX, y1);
        procAppendLine(svg, midX, y1, midX, y2);
        procAppendLine(svg, midX, y2, x2, y2);
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
    if (target.tagName === 'A') return;
}

// ============================================================
// DRAG AND DROP - Processos
// ============================================================
var procDragId = null;
var procDragEl = null;
var procDragStartX = 0;
var procDragStartY = 0;
var procDragOrigLeft = 0;
var procDragOrigTop = 0;
var procIsDragging = false;

function onProcDragStart(e) {
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
    if (target.tagName === 'A') return;

    var el = e.currentTarget;
    var id = el.getAttribute('data-id');
    if (!id) return;

    e.preventDefault();
    procDragId = id;
    procDragEl = el;
    procIsDragging = false;

    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
    var clientY = e.touches ? e.touches[0].clientY : e.clientY;
    procDragStartX = clientX;
    procDragStartY = clientY;
    procDragOrigLeft = parseInt(el.style.left) || 0;
    procDragOrigTop = parseInt(el.style.top) || 0;

    document.addEventListener('mousemove', onProcDragMove);
    document.addEventListener('mouseup', onProcDragEnd);
    document.addEventListener('touchmove', onProcDragMove, { passive: false });
    document.addEventListener('touchend', onProcDragEnd);
}

function onProcDragMove(e) {
    if (!procDragEl) return;
    e.preventDefault();

    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
    var clientY = e.touches ? e.touches[0].clientY : e.clientY;
    var dx = clientX - procDragStartX;
    var dy = clientY - procDragStartY;

    if (!procIsDragging && Math.abs(dx) + Math.abs(dy) < 5) return;
    procIsDragging = true;

    procDragEl.style.left = (procDragOrigLeft + dx) + 'px';
    procDragEl.style.top = (procDragOrigTop + dy) + 'px';
    procDragEl.style.zIndex = '100';
    procDragEl.style.opacity = '0.8';
    procDragEl.style.transition = 'none';

    // Highlight
    procHighlightTarget(clientX, clientY);
}

function onProcDragEnd(e) {
    document.removeEventListener('mousemove', onProcDragMove);
    document.removeEventListener('mouseup', onProcDragEnd);
    document.removeEventListener('touchmove', onProcDragMove);
    document.removeEventListener('touchend', onProcDragEnd);

    if (!procDragEl || !procDragId) { procResetDrag(); return; }

    if (!procIsDragging) {
        procResetDrag();
        return;
    }

    var clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    var clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
    var targetId = procFindDropTarget(clientX, clientY);

    if (targetId && targetId !== procDragId) {
        var dragProc = processos[procDragId];
        var targetProc = processos[targetId];

        if (dragProc.parent === targetProc.parent) {
            // Irmaos - trocar order
            var tempOrder = dragProc.order;
            processosRef.child(procDragId).child('order').set(targetProc.order);
            processosRef.child(targetId).child('order').set(tempOrder);
        } else {
            // Mover para debaixo do target
            processosRef.child(procDragId).child('parent').set(targetId);
        }
    }

    procResetDrag();
    renderProcessos();
}

function procResetDrag() {
    if (procDragEl) {
        procDragEl.style.zIndex = '';
        procDragEl.style.opacity = '';
        procDragEl.style.transition = '';
    }
    procDragId = null;
    procDragEl = null;
    procIsDragging = false;
    procClearHighlights();
}

function procFindDropTarget(clientX, clientY) {
    var container = document.getElementById('processosContainer');
    var cards = container.querySelectorAll('.proc-node');
    for (var i = 0; i < cards.length; i++) {
        if (cards[i] === procDragEl) continue;
        var rect = cards[i].getBoundingClientRect();
        if (clientX >= rect.left && clientX <= rect.right &&
            clientY >= rect.top && clientY <= rect.bottom) {
            return cards[i].getAttribute('data-id');
        }
    }
    return null;
}

function procHighlightTarget(clientX, clientY) {
    procClearHighlights();
    var targetId = procFindDropTarget(clientX, clientY);
    if (targetId) {
        var container = document.getElementById('processosContainer');
        var cards = container.querySelectorAll('.proc-node');
        for (var i = 0; i < cards.length; i++) {
            if (cards[i].getAttribute('data-id') === targetId) {
                cards[i].classList.add('drop-target');
                break;
            }
        }
    }
}

function procClearHighlights() {
    var cards = document.querySelectorAll('.proc-node.drop-target');
    for (var i = 0; i < cards.length; i++) {
        cards[i].classList.remove('drop-target');
    }
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
