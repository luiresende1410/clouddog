// ============================================================
// CONFIGURACAO FIREBASE
// Substitua com as credenciais do seu projeto Firebase
// ============================================================
const firebaseConfig = {
    databaseURL: "https://clouddog-adm-default-rtdb.firebaseio.com"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const nodesRef = db.ref('nodes');

// ============================================================
// ESTADO DA APLICACAO
// ============================================================
let nodes = {};
let editingNodeId = null;

// ============================================================
// DADOS INICIAIS (caso o Firebase esteja vazio)
// ============================================================
const defaultNodes = {
    "clouddog": {
        name: "CloudDog",
        parent: "",
        color: "#f5c842",
        textColor: "#333",
        gestor: "Nome do CEO / Diretor",
        lider: "",
        membros: [],
        links: [
            { label: "Site Institucional", url: "#" }
        ],
        order: 0
    },
    "cyber": {
        name: "Cyber Security",
        parent: "clouddog",
        color: "#e74c3c",
        textColor: "#fff",
        gestor: "Nome do Gestor",
        lider: "Nome do Lider",
        membros: ["Membro 1", "Membro 2"],
        links: [
            { label: "Processo de Resposta a Incidentes", url: "#" },
            { label: "Politica de Seguranca", url: "#" }
        ],
        order: 1
    },
    "soc": {
        name: "SOC",
        parent: "cyber",
        color: "#f1948a",
        textColor: "#333",
        gestor: "Nome do Gestor",
        lider: "Nome do Lider",
        membros: ["Analista 1", "Analista 2"],
        links: [
            { label: "Runbook SOC", url: "#" }
        ],
        order: 2
    },
    "siem": {
        name: "SIEM",
        parent: "cyber",
        color: "#f1948a",
        textColor: "#333",
        gestor: "Nome do Gestor",
        lider: "Nome do Lider",
        membros: ["Engenheiro 1", "Engenheiro 2"],
        links: [
            { label: "Documentacao SIEM", url: "#" }
        ],
        order: 3
    },
    "cloudops": {
        name: "CloudOps",
        parent: "clouddog",
        color: "#2c3e50",
        textColor: "#fff",
        gestor: "Nome do Gestor",
        lider: "Nome do Lider",
        membros: [],
        links: [
            { label: "Processos CloudOps", url: "#" }
        ],
        order: 4
    },
    "projetos": {
        name: "PROJETOS",
        parent: "cloudops",
        color: "#2980b9",
        textColor: "#fff",
        gestor: "Nome do Gestor",
        lider: "Nome do Lider",
        membros: ["PM 1", "PM 2"],
        links: [
            { label: "Metodologia de Projetos", url: "#" }
        ],
        order: 5
    },
    "migracao": {
        name: "Migracao",
        parent: "projetos",
        color: "#85c1e9",
        textColor: "#333",
        gestor: "Nome do Gestor",
        lider: "Nome do Lider",
        membros: ["Eng. Cloud 1", "Eng. Cloud 2"],
        links: [
            { label: "Processo de Migracao", url: "#" }
        ],
        order: 6
    },
    "modernizacao": {
        name: "Modernizacao",
        parent: "projetos",
        color: "#85c1e9",
        textColor: "#333",
        gestor: "Nome do Gestor",
        lider: "Nome do Lider",
        membros: ["Arquiteto 1", "Dev 1"],
        links: [
            { label: "Framework de Modernizacao", url: "#" }
        ],
        order: 7
    },
    "msp": {
        name: "MSP",
        parent: "cloudops",
        color: "#2980b9",
        textColor: "#fff",
        gestor: "Nome do Gestor",
        lider: "Nome do Lider",
        membros: [],
        links: [
            { label: "SLA e Contratos", url: "#" }
        ],
        order: 8
    },
    "secops": {
        name: "SecOps",
        parent: "msp",
        color: "#85c1e9",
        textColor: "#333",
        gestor: "Nome do Gestor",
        lider: "Nome do Lider",
        membros: ["Eng. SecOps 1", "Eng. SecOps 2"],
        links: [
            { label: "Processo SecOps", url: "#" }
        ],
        order: 9
    },
    "finops": {
        name: "FinOps",
        parent: "msp",
        color: "#85c1e9",
        textColor: "#333",
        gestor: "Nome do Gestor",
        lider: "Nome do Lider",
        membros: ["Analista FinOps 1", "Analista FinOps 2"],
        links: [
            { label: "Dashboard de Custos", url: "#" }
        ],
        order: 10
    },
    "sre": {
        name: "SRE",
        parent: "msp",
        color: "#85c1e9",
        textColor: "#333",
        gestor: "Nome do Gestor",
        lider: "Nome do Lider",
        membros: ["SRE 1", "SRE 2"],
        links: [
            { label: "SLOs e SLIs", url: "#" }
        ],
        order: 11
    },
    "inovacao": {
        name: "Inovacao",
        parent: "clouddog",
        color: "#1abc9c",
        textColor: "#fff",
        gestor: "Nome do Gestor",
        lider: "Nome do Lider",
        membros: [],
        links: [
            { label: "Pipeline de Inovacao", url: "#" }
        ],
        order: 12
    },
    "genai": {
        name: "GenAI",
        parent: "inovacao",
        color: "#76d7c4",
        textColor: "#333",
        gestor: "Nome do Gestor",
        lider: "Nome do Lider",
        membros: ["ML Engineer 1"],
        links: [
            { label: "Projetos GenAI", url: "#" }
        ],
        order: 13
    },
    "dados": {
        name: "Dados",
        parent: "inovacao",
        color: "#76d7c4",
        textColor: "#333",
        gestor: "Nome do Gestor",
        lider: "Nome do Lider",
        membros: ["Data Engineer 1", "Data Analyst 1"],
        links: [
            { label: "Data Catalog", url: "#" }
        ],
        order: 14
    },
    "ml": {
        name: "Machine Learning",
        parent: "inovacao",
        color: "#76d7c4",
        textColor: "#333",
        gestor: "Nome do Gestor",
        lider: "Nome do Lider",
        membros: ["ML Engineer 1", "Data Scientist 1"],
        links: [
            { label: "MLOps Pipeline", url: "#" }
        ],
        order: 15
    },
    "dev": {
        name: "Desenvolvimento",
        parent: "inovacao",
        color: "#1abc9c",
        textColor: "#fff",
        gestor: "Nome do Gestor",
        lider: "Nome do Lider",
        membros: ["Dev 1", "Dev 2", "Dev 3"],
        links: [
            { label: "Padroes de Codigo", url: "#" },
            { label: "CI/CD Pipeline", url: "#" }
        ],
        order: 16
    }
};

// ============================================================
// FIREBASE - ESCUTAR MUDANCAS EM TEMPO REAL
// ============================================================
nodesRef.on('value', function(snapshot) {
    var val = snapshot.val();
    if (val) {
        nodes = val;
    } else {
        // Primeiro acesso - popular com dados iniciais
        nodesRef.set(defaultNodes);
        nodes = defaultNodes;
    }
    render();
});

// ============================================================
// LAYOUT - CALCULAR POSICOES DOS NOS
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

function getSubtreeLeafCount(nodeId) {
    var children = getChildren(nodeId);
    if (children.length === 0) return 1;
    var count = 0;
    for (var i = 0; i < children.length; i++) {
        count += getSubtreeLeafCount(children[i]);
    }
    return count;
}

// ============================================================
// RENDERIZAR O ORGANOGRAMA
// ============================================================
function render() {
    var container = document.getElementById('nodesContainer');
    var svg = document.getElementById('linesSvg');
    var chartContainer = document.getElementById('chartContainer');

    container.innerHTML = '';

    // Encontrar raiz(es)
    var roots = [];
    var keys = Object.keys(nodes);
    for (var i = 0; i < keys.length; i++) {
        if (!nodes[keys[i]].parent || nodes[keys[i]].parent === '') {
            roots.push(keys[i]);
        }
    }

    if (roots.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#888;padding:40px;">Nenhuma area cadastrada. Clique em "+ Nova Area" para comecar.</p>';
        return;
    }

    // Usar largura disponivel do container
    var availableWidth = chartContainer.offsetWidth - 60;
    if (availableWidth < 600) availableWidth = 600;

    var LEVEL_HEIGHT = 120;
    var NODE_MIN_WIDTH = 180;

    // Calcular posicoes baseado na largura disponivel
    var positions = {};

    function calculatePositions(nodeId, leftBound, rightBound, y) {
        var centerX = (leftBound + rightBound) / 2;
        positions[nodeId] = { x: centerX, y: y };

        var children = getChildren(nodeId);
        if (children.length === 0) return;

        // Distribuir filhos proporcionalmente ao numero de folhas
        var totalLeaves = 0;
        var childLeaves = [];
        for (var i = 0; i < children.length; i++) {
            var leaves = getSubtreeLeafCount(children[i]);
            childLeaves.push(leaves);
            totalLeaves += leaves;
        }

        var sectionWidth = rightBound - leftBound;
        var currentLeft = leftBound;

        for (var i = 0; i < children.length; i++) {
            var childWidth = (childLeaves[i] / totalLeaves) * sectionWidth;
            calculatePositions(children[i], currentLeft, currentLeft + childWidth, y + LEVEL_HEIGHT);
            currentLeft += childWidth;
        }
    }

    // Posicionar cada raiz
    if (roots.length === 1) {
        calculatePositions(roots[0], 0, availableWidth, 30);
    } else {
        var sectionPerRoot = availableWidth / roots.length;
        for (var i = 0; i < roots.length; i++) {
            calculatePositions(roots[i], i * sectionPerRoot, (i + 1) * sectionPerRoot, 30);
        }
    }

    // Determinar altura necessaria
    var maxY = 0;
    var posKeys = Object.keys(positions);
    for (var i = 0; i < posKeys.length; i++) {
        if (positions[posKeys[i]].y > maxY) maxY = positions[posKeys[i]].y;
    }

    var totalHeight = maxY + 80;
    container.style.width = availableWidth + 'px';
    container.style.height = totalHeight + 'px';
    container.style.margin = '0 auto';
    svg.style.width = availableWidth + 'px';
    svg.style.height = totalHeight + 'px';
    svg.setAttribute('width', availableWidth);
    svg.setAttribute('height', totalHeight);
    chartContainer.style.minHeight = (totalHeight + 100) + 'px';

    // Limpar SVG
    while (svg.firstChild) {
        svg.removeChild(svg.firstChild);
    }

    // Renderizar nos
    for (var i = 0; i < keys.length; i++) {
        var id = keys[i];
        var node = nodes[id];
        var pos = positions[id];
        if (!pos) continue;

        var div = document.createElement('div');
        div.className = 'node-card';
        div.style.background = node.color || '#2980b9';
        div.style.color = node.textColor || '#fff';
        div.style.left = pos.x + 'px';
        div.style.top = pos.y + 'px';
        div.style.transform = 'translateX(-50%)';
        div.setAttribute('data-id', id);
        div.innerHTML = node.name + '<span class="edit-icon">&#9998;</span>';

        div.addEventListener('click', handleNodeClick);
        div.addEventListener('contextmenu', handleNodeRightClick);

        container.appendChild(div);
    }

    // Desenhar conectores estilo organograma (linhas ortogonais)
    var cardElements = container.querySelectorAll('.node-card');
    var cardMap = {};
    for (var i = 0; i < cardElements.length; i++) {
        var cardId = cardElements[i].getAttribute('data-id');
        cardMap[cardId] = cardElements[i];
    }

    // Agrupar filhos por pai
    var childrenByParent = {};
    for (var i = 0; i < keys.length; i++) {
        var id = keys[i];
        var node = nodes[id];
        if (!node.parent || node.parent === '') continue;
        if (!childrenByParent[node.parent]) childrenByParent[node.parent] = [];
        childrenByParent[node.parent].push(id);
    }

    // Para cada pai, desenhar conector em arvore
    var parentIds = Object.keys(childrenByParent);
    for (var p = 0; p < parentIds.length; p++) {
        var parentId = parentIds[p];
        var children = childrenByParent[parentId];
        var parentEl = cardMap[parentId];
        if (!parentEl) continue;

        var px = parentEl.offsetLeft + parentEl.offsetWidth / 2;
        var py = parentEl.offsetTop + parentEl.offsetHeight;

        // Ponto medio vertical entre pai e filhos
        var firstChild = cardMap[children[0]];
        if (!firstChild) continue;
        var childY = firstChild.offsetTop;
        var midY = py + (childY - py) / 2;

        // Linha vertical do pai ate o ponto medio
        var lineDown = document.createElementNS("http://www.w3.org/2000/svg", "line");
        lineDown.setAttribute("x1", px);
        lineDown.setAttribute("y1", py);
        lineDown.setAttribute("x2", px);
        lineDown.setAttribute("y2", midY);
        svg.appendChild(lineDown);

        if (children.length === 1) {
            // Apenas uma linha vertical direto ao filho
            var childEl = cardMap[children[0]];
            if (childEl) {
                var cx = childEl.offsetLeft + childEl.offsetWidth / 2;
                var cy = childEl.offsetTop;
                var lineToChild = document.createElementNS("http://www.w3.org/2000/svg", "line");
                lineToChild.setAttribute("x1", px);
                lineToChild.setAttribute("y1", midY);
                lineToChild.setAttribute("x2", cx);
                lineToChild.setAttribute("y2", cy);
                svg.appendChild(lineToChild);
            }
        } else {
            // Linha horizontal conectando todos os filhos no ponto medio
            var minX = Infinity, maxX = -Infinity;
            var childPositions = [];
            for (var c = 0; c < children.length; c++) {
                var childEl = cardMap[children[c]];
                if (!childEl) continue;
                var cx = childEl.offsetLeft + childEl.offsetWidth / 2;
                childPositions.push(cx);
                if (cx < minX) minX = cx;
                if (cx > maxX) maxX = cx;
            }

            // Linha horizontal
            var lineHoriz = document.createElementNS("http://www.w3.org/2000/svg", "line");
            lineHoriz.setAttribute("x1", minX);
            lineHoriz.setAttribute("y1", midY);
            lineHoriz.setAttribute("x2", maxX);
            lineHoriz.setAttribute("y2", midY);
            svg.appendChild(lineHoriz);

            // Linhas verticais da barra horizontal para cada filho
            for (var c = 0; c < children.length; c++) {
                var childEl = cardMap[children[c]];
                if (!childEl) continue;
                var cx = childEl.offsetLeft + childEl.offsetWidth / 2;
                var cy = childEl.offsetTop;

                var lineChildDown = document.createElementNS("http://www.w3.org/2000/svg", "line");
                lineChildDown.setAttribute("x1", cx);
                lineChildDown.setAttribute("y1", midY);
                lineChildDown.setAttribute("x2", cx);
                lineChildDown.setAttribute("y2", cy);
                svg.appendChild(lineChildDown);
            }
        }
    }

    updateParentSelect();
}

// ============================================================
// EVENTOS DOS NOS
// ============================================================
function handleNodeClick(e) {
    var id = this.getAttribute('data-id');
    // Se clicou no icone de editar
    if (e.target.classList.contains('edit-icon')) {
        openEditForm(id);
    } else {
        openDetailModal(id);
    }
}

function handleNodeRightClick(e) {
    e.preventDefault();
    var id = this.getAttribute('data-id');
    openEditForm(id);
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
    if (item.lider) html += '<li><strong>Lider:</strong> ' + item.lider + '</li>';
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
        // Editando
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
        // Novo
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
    keys.sort(function(a, b) {
        return (nodes[a].order || 0) - (nodes[b].order || 0);
    });

    for (var i = 0; i < keys.length; i++) {
        // Nao pode ser pai de si mesmo
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
        return {
            label: (parts[0] || '').trim(),
            url: (parts[1] || '#').trim()
        };
    });

    // Determinar cor do texto baseado na cor de fundo
    var textColor = isLightColor(color) ? '#333' : '#fff';

    var nodeData = {
        name: name,
        parent: parent,
        color: color,
        textColor: textColor,
        gestor: gestor,
        lider: lider,
        membros: membros,
        links: links,
        order: 0
    };

    if (id) {
        // Atualizar existente
        nodeData.order = nodes[id].order || 0;
        nodesRef.child(id).set(nodeData);
    } else {
        // Criar novo
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

    if (confirm('Tem certeza que deseja excluir "' + nodeName + '"?\nOs filhos desta area ficarao sem pai.')) {
        // Mover filhos para sem pai
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
    var id = name.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    // Evitar duplicatas
    if (nodes[id]) {
        id = id + '-' + Date.now().toString(36);
    }
    return id;
}

function isLightColor(hex) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    var luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
}

function closeAllModals() {
    document.getElementById('modalOverlay').classList.remove('active');
    document.getElementById('formOverlay').classList.remove('active');
}

function closeModal(event) {
    if (!event || event.target === document.getElementById('modalOverlay')) {
        document.getElementById('modalOverlay').classList.remove('active');
    }
}

// ============================================================
// EVENT LISTENERS
// ============================================================
document.getElementById('btnAddNode').addEventListener('click', function() {
    openEditForm(null);
});

document.getElementById('btnCloseModal').addEventListener('click', function() {
    document.getElementById('modalOverlay').classList.remove('active');
});

document.getElementById('btnCloseForm').addEventListener('click', function() {
    document.getElementById('formOverlay').classList.remove('active');
});

document.getElementById('modalOverlay').addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('active');
});

document.getElementById('formOverlay').addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('active');
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeAllModals();
});

// Redesenhar ao redimensionar a janela
window.addEventListener('resize', function() {
    if (Object.keys(nodes).length > 0) {
        render();
    }
});
