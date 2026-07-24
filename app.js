// ============================================================
// CONFIGURACAO FIREBASE
// ============================================================
var firebaseConfig = {
    apiKey: "AIzaSyDFSdc-m9YwhpxYNBhbMgUIBBjEPIT-IsQ",
    authDomain: "clouddog-adm.firebaseapp.com",
    databaseURL: "https://clouddog-adm-default-rtdb.firebaseio.com",
    projectId: "clouddog-adm",
    storageBucket: "clouddog-adm.firebasestorage.app",
    messagingSenderId: "889049198752",
    appId: "1:889049198752:web:378fbb107736e11352d9c5",
    measurementId: "G-KR3W9VTRYZ"
};

firebase.initializeApp(firebaseConfig);
var db = firebase.database();
var auth = firebase.auth();
var nodesRef = db.ref('nodes');
var provider = new firebase.auth.GoogleAuthProvider();

var ALLOWED_DOMAIN = "clouddog.com.br";

// ============================================================
// ESTADO
// ============================================================
var nodes = {};
var editingNodeId = null;
var currentUser = null;
var dbListener = null;

// Drag state
var dragId = null;
var dragEl = null;
var dragStartX = 0;
var dragStartY = 0;
var dragOrigLeft = 0;
var dragOrigTop = 0;
var isDragging = false;

// Collapse state (local, nao salva no Firebase)
var collapsedNodes = {};

// ============================================================
// AUTENTICACAO
// ============================================================
auth.onAuthStateChanged(function(user) {
    if (user) {
        var email = user.email || '';
        var domain = email.split('@')[1];
        if (domain === ALLOWED_DOMAIN) {
            currentUser = user;
            showApp(user);
            startListening();
        } else {
            auth.signOut();
            showLoginWall('Acesso restrito a emails @' + ALLOWED_DOMAIN);
        }
    } else {
        currentUser = null;
        stopListening();
        showLoginWall(null);
    }
});

function showApp(user) {
    document.getElementById('btnLogin').style.display = 'none';
    document.getElementById('userInfo').style.display = 'flex';
    document.getElementById('userName').textContent = user.displayName || user.email;
    document.getElementById('userPhoto').src = user.photoURL || '';
    document.getElementById('appShell').style.display = 'flex';
    document.getElementById('loginWall').style.display = 'none';
    startProcessosListener();
}

function showLoginWall(errorMsg) {
    document.getElementById('btnLogin').style.display = 'inline-block';
    document.getElementById('userInfo').style.display = 'none';
    document.getElementById('appShell').style.display = 'none';
    document.getElementById('loginWall').style.display = 'flex';
    var errorEl = document.getElementById('loginError');
    if (errorMsg) {
        errorEl.textContent = errorMsg;
        errorEl.style.display = 'block';
    } else {
        errorEl.style.display = 'none';
    }
    stopProcessosListener();
}

function doLogin() {
    provider.setCustomParameters({ hd: ALLOWED_DOMAIN });
    auth.signInWithPopup(provider).catch(function(error) {
        showLoginWall('Erro ao fazer login. Tente novamente.');
    });
}

function doLogout() { auth.signOut(); }

// ============================================================
// FIREBASE REALTIME
// ============================================================
function startListening() {
    if (dbListener) return;
    dbListener = nodesRef.on('value', function(snapshot) {
        var val = snapshot.val();
        if (val) {
            nodes = val;
        } else {
            nodesRef.set(defaultNodes);
            nodes = defaultNodes;
        }
        render();
    });
}

function stopListening() {
    if (dbListener) {
        nodesRef.off('value', dbListener);
        dbListener = null;
    }
    nodes = {};
    var c = document.getElementById('nodesContainer');
    if (c) c.innerHTML = '';
}

// ============================================================
// DADOS INICIAIS
// ============================================================
var defaultNodes = {
    "clouddog": { name: "CloudDog", parent: "", color: "#f5c842", textColor: "#333", gestor: "Alessandro Oliveira", lider: "CEO", membros: [], links: [{ label: "Site Institucional", url: "#" }], order: 0 },
    "cyber": { name: "Cyber Security", parent: "clouddog", color: "#e74c3c", textColor: "#fff", gestor: "", lider: "", membros: [], links: [], order: 1 },
    "soc": { name: "SOC", parent: "cyber", color: "#f1948a", textColor: "#333", gestor: "", lider: "", membros: [], links: [], order: 2 },
    "siem": { name: "SIEM", parent: "cyber", color: "#f1948a", textColor: "#333", gestor: "", lider: "", membros: [], links: [], order: 3 },
    "cloudops": { name: "CloudOps", parent: "clouddog", color: "#2c3e50", textColor: "#fff", gestor: "Luiz Resende", lider: "Head de Operacoes em Nuvem", membros: [], links: [], order: 4 },
    "projetos": { name: "PROJETOS", parent: "cloudops", color: "#2980b9", textColor: "#fff", gestor: "", lider: "Lider DevOps", membros: [], links: [], order: 5 },
    "migracao": { name: "Migracao", parent: "projetos", color: "#85c1e9", textColor: "#333", gestor: "", lider: "", membros: [], links: [], order: 6 },
    "modernizacao": { name: "Modernizacao", parent: "projetos", color: "#85c1e9", textColor: "#333", gestor: "", lider: "", membros: [], links: [], order: 7 },
    "msp": { name: "MSP", parent: "cloudops", color: "#2980b9", textColor: "#fff", gestor: "", lider: "Lider Nuvem Gerenciada", membros: [], links: [], order: 8 },
    "secops": { name: "SecOps", parent: "msp", color: "#85c1e9", textColor: "#333", gestor: "", lider: "", membros: [], links: [], order: 9 },
    "finops": { name: "FinOps", parent: "msp", color: "#85c1e9", textColor: "#333", gestor: "", lider: "", membros: [], links: [], order: 10 },
    "sre": { name: "SRE", parent: "msp", color: "#85c1e9", textColor: "#333", gestor: "", lider: "", membros: [], links: [], order: 11 },
    "inovacao": { name: "Inovacao", parent: "clouddog", color: "#1abc9c", textColor: "#fff", gestor: "", lider: "", membros: [], links: [], order: 12 },
    "genai": { name: "GenAI", parent: "inovacao", color: "#76d7c4", textColor: "#333", gestor: "", lider: "", membros: [], links: [], order: 13 },
    "dados": { name: "Dados", parent: "inovacao", color: "#76d7c4", textColor: "#333", gestor: "", lider: "", membros: [], links: [], order: 14 },
    "ml": { name: "Machine Learning", parent: "inovacao", color: "#76d7c4", textColor: "#333", gestor: "", lider: "", membros: [], links: [], order: 15 },
    "dev": { name: "Desenvolvimento", parent: "inovacao", color: "#1abc9c", textColor: "#fff", gestor: "", lider: "", membros: [], links: [], order: 16 }
};

// ============================================================
// HELPERS
// ============================================================
function getChildren(parentId) {
    var children = [];
    var keys = Object.keys(nodes);
    for (var i = 0; i < keys.length; i++) {
        if (nodes[keys[i]].parent === parentId) {
            children.push(keys[i]);
        }
    }
    children.sort(function(a, b) {
        return (nodes[a].order || 0) - (nodes[b].order || 0);
    });
    return children;
}

function isLeaf(nodeId) {
    return getChildren(nodeId).length === 0;
}

function subtreeWidth(id) {
    var children = getChildren(id);
    if (children.length === 0 || collapsedNodes[id]) return NODE_W;
    var total = 0;
    for (var i = 0; i < children.length; i++) {
        if (i > 0) total += H_GAP;
        total += subtreeWidth(children[i]);
    }
    return Math.max(NODE_W, total);
}

function estimateNodeHeight(id) {
    var node = nodes[id];
    var h = NODE_H_BASE;
    if (node.membros && node.membros.length > 0) {
        h += Math.min(node.membros.length, 6) * 13 + 10;
    }
    return h;
}

var NODE_W = 150;
var NODE_H_BASE = 56;
var H_GAP = 30;
var V_GAP = 60;

// ============================================================
// RENDER
// ============================================================
var positions = {};
var nodeHeights = {};

function render() {
    var chartInner = document.getElementById('chartInner');
    var container = document.getElementById('nodesContainer');
    var svg = document.getElementById('linesSvg');

    container.innerHTML = '';
    svg.innerHTML = '';
    positions = {};
    nodeHeights = {};

    var keys = Object.keys(nodes);
    if (keys.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#888;padding:60px;">Nenhuma area cadastrada.</p>';
        return;
    }

    var roots = [];
    for (var i = 0; i < keys.length; i++) {
        if (!nodes[keys[i]].parent || nodes[keys[i]].parent === '') {
            roots.push(keys[i]);
        }
    }
    if (roots.length === 0) return;

    function layout(id, x, y) {
        var h = estimateNodeHeight(id);
        nodeHeights[id] = h;
        var children = getChildren(id);

        if (children.length === 0 || collapsedNodes[id]) {
            positions[id] = { x: x, y: y, w: NODE_W, h: h };
            return NODE_W;
        }

        var totalChildW = 0;
        var childWidths = [];
        for (var i = 0; i < children.length; i++) {
            var cw = subtreeWidth(children[i]);
            childWidths.push(cw);
            totalChildW += cw;
            if (i > 0) totalChildW += H_GAP;
        }

        var nodeX = x + totalChildW / 2 - NODE_W / 2;
        positions[id] = { x: nodeX, y: y, w: NODE_W, h: h };

        var childY = y + h + V_GAP;
        var cx = x;
        for (var i = 0; i < children.length; i++) {
            layout(children[i], cx, childY);
            cx += childWidths[i] + H_GAP;
        }
        return totalChildW;
    }

    // Layout raizes
    var totalW = 0;
    var rootWidths = [];
    for (var i = 0; i < roots.length; i++) {
        var rw = subtreeWidth(roots[i]);
        rootWidths.push(rw);
        totalW += rw;
        if (i > 0) totalW += H_GAP * 2;
    }

    var startX = 20;
    for (var i = 0; i < roots.length; i++) {
        layout(roots[i], startX, 20);
        startX += rootWidths[i] + H_GAP * 2;
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
    chartInner.style.width = chartW + 'px';
    chartInner.style.height = chartH + 'px';
    svg.setAttribute('width', chartW);
    svg.setAttribute('height', chartH);
    svg.style.width = chartW + 'px';
    svg.style.height = chartH + 'px';

    // Renderizar nos
    for (var i = 0; i < keys.length; i++) {
        var id = keys[i];
        var node = nodes[id];
        var pos = positions[id];
        if (!pos) continue;

        var children = getChildren(id);
        var hasChildren = children.length > 0;
        var isCollapsed = !!collapsedNodes[id];

        var div = document.createElement('div');
        div.className = 'node-card';
        if (!node.parent || node.parent === '') div.className += ' is-root';
        if (!hasChildren) div.className += ' is-leaf';
        if (isCollapsed) div.className += ' is-collapsed';

        div.style.background = node.color || '#2980b9';
        div.style.color = node.textColor || '#fff';
        div.style.left = pos.x + 'px';
        div.style.top = pos.y + 'px';
        div.style.width = pos.w + 'px';
        div.setAttribute('data-id', id);

        var html = '<span class="edit-icon">&#9998;</span>';
        html += '<div class="node-title">' + node.name + '</div>';
        if (node.lider) html += '<div class="node-role">' + node.lider + '</div>';
        if (node.membros && node.membros.length > 0) {
            var show = node.membros.slice(0, 6);
            html += '<div class="node-members">' + show.join('<br>');
            if (node.membros.length > 6) html += '<br>...';
            html += '</div>';
        }

        // Botao collapse/expand
        if (hasChildren) {
            var toggleLabel = isCollapsed ? '+' : '−';
            var childCount = children.length;
            html += '<span class="toggle-btn" data-toggle-id="' + id + '" title="' + (isCollapsed ? 'Expandir' : 'Colapsar') + ' (' + childCount + ')">' + toggleLabel + '</span>';
        }

        div.innerHTML = html;
        div.addEventListener('mousedown', onDragStart);
        div.addEventListener('touchstart', onDragStart, { passive: false });
        container.appendChild(div);
    }

    // Conectores
    for (var i = 0; i < keys.length; i++) {
        var id = keys[i];
        var node = nodes[id];
        if (!node.parent || node.parent === '') continue;
        // Nao desenhar se o pai esta colapsado
        if (collapsedNodes[node.parent]) continue;
        var parentPos = positions[node.parent];
        var childPos = positions[id];
        if (!parentPos || !childPos) continue;

        var parentH = nodeHeights[node.parent] || NODE_H_BASE;
        var x1 = parentPos.x + parentPos.w / 2;
        var y1 = parentPos.y + parentH;
        var x2 = childPos.x + childPos.w / 2;
        var y2 = childPos.y;
        var midY = y1 + (y2 - y1) / 2;

        appendLine(svg, x1, y1, x1, midY);
        appendLine(svg, x1, midY, x2, midY);
        appendLine(svg, x2, midY, x2, y2);
    }

    updateParentSelect();
}

function appendLine(svg, x1, y1, x2, y2) {
    var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    svg.appendChild(line);
}

// ============================================================
// DRAG AND DROP - Reordenar irmaos
// ============================================================
function onDragStart(e) {
    // Ignorar se clicou no edit icon
    if (e.target.classList.contains('edit-icon')) return;

    // Toggle collapse/expand
    if (e.target.classList.contains('toggle-btn')) {
        var toggleId = e.target.getAttribute('data-toggle-id');
        if (toggleId) {
            if (collapsedNodes[toggleId]) {
                delete collapsedNodes[toggleId];
            } else {
                collapsedNodes[toggleId] = true;
            }
            render();
        }
        return;
    }

    var el = e.currentTarget;
    var id = el.getAttribute('data-id');
    if (!id) return;

    e.preventDefault();
    dragId = id;
    dragEl = el;
    isDragging = false;

    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
    var clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragStartX = clientX;
    dragStartY = clientY;
    dragOrigLeft = parseInt(el.style.left) || 0;
    dragOrigTop = parseInt(el.style.top) || 0;

    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
    document.addEventListener('touchmove', onDragMove, { passive: false });
    document.addEventListener('touchend', onDragEnd);
}

function onDragMove(e) {
    if (!dragEl) return;
    e.preventDefault();

    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
    var clientY = e.touches ? e.touches[0].clientY : e.clientY;
    var dx = clientX - dragStartX;
    var dy = clientY - dragStartY;

    // Iniciar drag apenas apos 5px de movimento
    if (!isDragging && Math.abs(dx) + Math.abs(dy) < 5) return;
    isDragging = true;

    dragEl.style.left = (dragOrigLeft + dx) + 'px';
    dragEl.style.top = (dragOrigTop + dy) + 'px';
    dragEl.style.zIndex = '100';
    dragEl.style.opacity = '0.8';
    dragEl.style.transition = 'none';

    // Highlight drop target
    highlightDropTarget(clientX, clientY);
}

function onDragEnd(e) {
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', onDragEnd);
    document.removeEventListener('touchmove', onDragMove);
    document.removeEventListener('touchend', onDragEnd);

    if (!dragEl || !dragId) { resetDrag(); return; }

    if (!isDragging) {
        // Foi apenas um clique
        var id = dragId;
        resetDrag();
        openDetailModal(id);
        return;
    }

    // Encontrar o no sobre o qual soltou
    var clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    var clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
    var targetId = findDropTarget(clientX, clientY);

    if (targetId && targetId !== dragId) {
        // Reordenar: trocar a posicao (order) entre irmaos
        var dragNode = nodes[dragId];
        var targetNode = nodes[targetId];

        if (dragNode.parent === targetNode.parent) {
            // Irmaos - trocar order
            var tempOrder = dragNode.order;
            nodesRef.child(dragId).child('order').set(targetNode.order);
            nodesRef.child(targetId).child('order').set(tempOrder);
        } else {
            // Mudar o pai do no arrastado para o targetId
            nodesRef.child(dragId).child('parent').set(targetId);
        }
    }

    resetDrag();
    render();
}

function resetDrag() {
    if (dragEl) {
        dragEl.style.zIndex = '';
        dragEl.style.opacity = '';
        dragEl.style.transition = '';
    }
    dragId = null;
    dragEl = null;
    isDragging = false;
    clearHighlights();
}

function findDropTarget(clientX, clientY) {
    var container = document.getElementById('nodesContainer');
    var cards = container.querySelectorAll('.node-card');
    for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        if (card === dragEl) continue;
        var rect = card.getBoundingClientRect();
        if (clientX >= rect.left && clientX <= rect.right &&
            clientY >= rect.top && clientY <= rect.bottom) {
            return card.getAttribute('data-id');
        }
    }
    return null;
}

function highlightDropTarget(clientX, clientY) {
    clearHighlights();
    var targetId = findDropTarget(clientX, clientY);
    if (targetId) {
        var container = document.getElementById('nodesContainer');
        var cards = container.querySelectorAll('.node-card');
        for (var i = 0; i < cards.length; i++) {
            if (cards[i].getAttribute('data-id') === targetId) {
                cards[i].classList.add('drop-target');
                break;
            }
        }
    }
}

function clearHighlights() {
    var cards = document.querySelectorAll('.node-card.drop-target');
    for (var i = 0; i < cards.length; i++) {
        cards[i].classList.remove('drop-target');
    }
}

// ============================================================
// EVENTOS DOS NOS (edit icon)
// ============================================================
function handleNodeClick(e) {
    var id = this.getAttribute('data-id');
    if (e.target.classList.contains('edit-icon')) {
        openEditForm(id);
    }
}

function handleNodeRightClick(e) {
    e.preventDefault();
    openEditForm(this.getAttribute('data-id'));
}

// ============================================================
// MODAL DE DETALHES
// ============================================================
function openDetailModal(key) {
    var item = nodes[key];
    if (!item) return;

    var html = '<h2>' + item.name + '</h2>';
    html += '<h3>&#128100; Equipe</h3><ul>';
    if (item.gestor) html += '<li><strong>Gestor:</strong> ' + item.gestor + '</li>';
    if (item.lider) html += '<li><strong>Cargo/Lider:</strong> ' + item.lider + '</li>';
    if (item.membros && item.membros.length > 0) {
        for (var i = 0; i < item.membros.length; i++) {
            if (item.membros[i]) html += '<li>' + item.membros[i] + '</li>';
        }
    }
    html += '</ul>';

    if (item.links && item.links.length > 0) {
        html += '<hr class="section-divider">';
        html += '<h3>&#128279; Links de Processos</h3><ul>';
        for (var i = 0; i < item.links.length; i++) {
            var link = item.links[i];
            if (link && link.label) {
                html += '<li><a href="' + (link.url || '#') + '" target="_blank">' + link.label + '</a></li>';
            }
        }
        html += '</ul>';
    }

    html += '<hr class="section-divider">';
    html += '<button class="btn btn-primary" onclick="openEditForm(\'' + key + '\')">&#9998; Editar</button>';

    document.getElementById('modalBody').innerHTML = html;
    document.getElementById('modalOverlay').classList.add('active');
}

// ============================================================
// FORMULARIO DE EDICAO / CRIACAO
// ============================================================
function openEditForm(id) {
    closeAllModals();
    editingNodeId = id || null;
    var form = document.getElementById('nodeForm');
    var deleteBtn = document.getElementById('btnDeleteNode');

    if (id && nodes[id]) {
        var node = nodes[id];
        document.getElementById('formTitle').textContent = 'Editar: ' + node.name;
        document.getElementById('formNodeId').value = id;
        document.getElementById('formName').value = node.name || '';
        document.getElementById('formParent').value = node.parent || '';
        document.getElementById('formColor').value = node.color || '#2980b9';
        document.getElementById('formGestor').value = node.gestor || '';
        document.getElementById('formLider').value = node.lider || '';
        document.getElementById('formMembros').value = (node.membros || []).join('\n');
        var linksText = '';
        if (node.links) {
            for (var i = 0; i < node.links.length; i++) {
                if (node.links[i] && node.links[i].label) {
                    linksText += node.links[i].label + ' | ' + (node.links[i].url || '#') + '\n';
                }
            }
        }
        document.getElementById('formLinks').value = linksText.trim();
        deleteBtn.style.display = 'inline-block';
    } else {
        document.getElementById('formTitle').textContent = 'Nova Area';
        form.reset();
        document.getElementById('formNodeId').value = '';
        document.getElementById('formColor').value = '#2980b9';
        deleteBtn.style.display = 'none';
    }

    updateParentSelect();
    document.getElementById('formOverlay').classList.add('active');
}

function updateParentSelect() {
    var select = document.getElementById('formParent');
    var currentVal = select.value;
    select.innerHTML = '<option value="">(Nenhuma - nivel raiz)</option>';
    var keys = Object.keys(nodes);
    keys.sort(function(a, b) { return (nodes[a].order || 0) - (nodes[b].order || 0); });
    for (var i = 0; i < keys.length; i++) {
        if (keys[i] === editingNodeId) continue;
        var opt = document.createElement('option');
        opt.value = keys[i];
        opt.textContent = nodes[keys[i]].name;
        select.appendChild(opt);
    }
    select.value = currentVal;
}

// ============================================================
// SALVAR NO
// ============================================================
document.getElementById('nodeForm').addEventListener('submit', function(e) {
    e.preventDefault();
    var id = document.getElementById('formNodeId').value;
    var name = document.getElementById('formName').value.trim();
    var parent = document.getElementById('formParent').value;
    var color = document.getElementById('formColor').value;
    var gestor = document.getElementById('formGestor').value.trim();
    var lider = document.getElementById('formLider').value.trim();
    var membrosText = document.getElementById('formMembros').value;
    var membros = membrosText.split('\n').map(function(m) { return m.trim(); }).filter(function(m) { return m !== ''; });
    var linksText = document.getElementById('formLinks').value;
    var linksLines = linksText.split('\n').filter(function(l) { return l.trim() !== ''; });
    var links = linksLines.map(function(line) {
        var parts = line.split('|');
        return { label: (parts[0] || '').trim(), url: (parts[1] || '#').trim() };
    });
    var textColor = isLightColor(color) ? '#333' : '#fff';
    var nodeData = { name: name, parent: parent, color: color, textColor: textColor, gestor: gestor, lider: lider, membros: membros, links: links, order: 0 };

    if (id) {
        nodeData.order = nodes[id].order || 0;
        nodesRef.child(id).set(nodeData);
    } else {
        var newId = generateId(name);
        nodeData.order = Object.keys(nodes).length;
        nodesRef.child(newId).set(nodeData);
    }
    closeAllModals();
});

// ============================================================
// EXCLUIR NO
// ============================================================
document.getElementById('btnDeleteNode').addEventListener('click', function() {
    if (!editingNodeId) return;
    var nodeName = nodes[editingNodeId] ? nodes[editingNodeId].name : editingNodeId;
    if (confirm('Excluir "' + nodeName + '"? Os filhos ficarao sem pai.')) {
        var children = getChildren(editingNodeId);
        for (var i = 0; i < children.length; i++) {
            nodesRef.child(children[i]).child('parent').set('');
        }
        nodesRef.child(editingNodeId).remove();
        closeAllModals();
    }
});

// ============================================================
// UTILIDADES
// ============================================================
function generateId(name) {
    var id = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (nodes[id]) id = id + '-' + Date.now().toString(36);
    return id;
}

function isLightColor(hex) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
}

function closeAllModals() {
    document.getElementById('modalOverlay').classList.remove('active');
    document.getElementById('formOverlay').classList.remove('active');
}

// ============================================================
// EVENT LISTENERS
// ============================================================
document.getElementById('btnAddNode').addEventListener('click', function() { openEditForm(null); });
document.getElementById('btnLogin').addEventListener('click', doLogin);
document.getElementById('btnLoginLarge').addEventListener('click', doLogin);
document.getElementById('btnLogout').addEventListener('click', doLogout);
document.getElementById('btnCloseModal').addEventListener('click', function() { document.getElementById('modalOverlay').classList.remove('active'); });
document.getElementById('btnCloseForm').addEventListener('click', function() { document.getElementById('formOverlay').classList.remove('active'); });
document.getElementById('modalOverlay').addEventListener('click', function(e) { if (e.target === this) this.classList.remove('active'); });
document.getElementById('formOverlay').addEventListener('click', function(e) { if (e.target === this) this.classList.remove('active'); });
document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeAllModals(); });
window.addEventListener('resize', function() { if (Object.keys(nodes).length > 0) render(); });

// ============================================================
// NAVEGACAO SIDEBAR
// ============================================================
var navItems = document.querySelectorAll('.nav-item');
for (var i = 0; i < navItems.length; i++) {
    navItems[i].addEventListener('click', function(e) {
        e.preventDefault();
        var page = this.getAttribute('data-page');
        switchPage(page);
    });
}

function switchPage(page) {
    // Update nav active state
    var items = document.querySelectorAll('.nav-item');
    for (var i = 0; i < items.length; i++) {
        items[i].classList.remove('active');
        if (items[i].getAttribute('data-page') === page) {
            items[i].classList.add('active');
        }
    }

    // Show/hide pages
    document.getElementById('pageOrganograma').style.display = page === 'organograma' ? 'block' : 'none';
    document.getElementById('pageProcessos').style.display = page === 'processos' ? 'block' : 'none';

    // Update title
    var titles = { organograma: 'Organograma Organizacional', processos: 'Mapa de Processos' };
    document.getElementById('pageTitle').textContent = titles[page] || '';

    // Re-render if needed
    if (page === 'organograma' && Object.keys(nodes).length > 0) render();
    if (page === 'processos') renderProcessos();
}

// Sidebar toggle (mobile)
document.getElementById('sidebarToggle').addEventListener('click', function() {
    document.getElementById('sidebar').classList.toggle('open');
});
