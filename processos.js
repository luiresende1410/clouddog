// ============================================================
// MAPA DE PROCESSOS
// ============================================================
var processosRef = db.ref('processos');
var processos = {};
var editingProcessoId = null;
var processosListener = null;

// Dados iniciais de processos
var defaultProcessos = {
    "onboarding": {
        name: "Onboarding de Colaboradores",
        owner: "RH",
        area: "Administrativo",
        color: "#9b59b6",
        links: [{ label: "Documento do Processo", url: "#" }],
        order: 0
    },
    "gestao-incidentes": {
        name: "Gestao de Incidentes",
        owner: "SOC",
        area: "Cyber Security",
        color: "#e74c3c",
        links: [{ label: "Runbook", url: "#" }, { label: "Fluxograma", url: "#" }],
        order: 1
    },
    "change-management": {
        name: "Change Management",
        owner: "CloudOps",
        area: "CloudOps",
        color: "#2980b9",
        links: [{ label: "Processo de Change", url: "#" }],
        order: 2
    }
};

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

function renderProcessos() {
    var grid = document.getElementById('processosGrid');
    if (!grid) return;
    grid.innerHTML = '';

    var keys = Object.keys(processos);
    keys.sort(function(a, b) {
        return (processos[a].order || 0) - (processos[b].order || 0);
    });

    if (keys.length === 0) {
        grid.innerHTML = '<p style="color:#888;text-align:center;padding:40px;">Nenhum processo cadastrado.</p>';
        return;
    }

    for (var i = 0; i < keys.length; i++) {
        var id = keys[i];
        var proc = processos[id];

        var card = document.createElement('div');
        card.className = 'processo-card';
        card.style.borderLeftColor = proc.color || '#3498db';
        card.setAttribute('data-id', id);

        var html = '<div class="processo-header">';
        html += '<h3>' + proc.name + '</h3>';
        html += '<span class="processo-edit" data-id="' + id + '">&#9998;</span>';
        html += '</div>';
        html += '<div class="processo-meta">';
        if (proc.owner) html += '<span class="processo-owner">&#128100; Owner: <strong>' + proc.owner + '</strong></span>';
        if (proc.area) html += '<span class="processo-area">&#127991; ' + proc.area + '</span>';
        html += '</div>';

        if (proc.links && proc.links.length > 0) {
            html += '<div class="processo-links">';
            for (var j = 0; j < proc.links.length; j++) {
                var link = proc.links[j];
                if (link && link.label) {
                    html += '<a href="' + (link.url || '#') + '" target="_blank">&#128279; ' + link.label + '</a>';
                }
            }
            html += '</div>';
        }

        card.innerHTML = html;
        grid.appendChild(card);
    }

    // Add event listeners to edit buttons
    var editBtns = grid.querySelectorAll('.processo-edit');
    for (var i = 0; i < editBtns.length; i++) {
        editBtns[i].addEventListener('click', function(e) {
            e.stopPropagation();
            openProcessoForm(this.getAttribute('data-id'));
        });
    }
}

function openProcessoForm(id) {
    editingProcessoId = id || null;
    var deleteBtn = document.getElementById('btnDeleteProcesso');

    if (id && processos[id]) {
        var proc = processos[id];
        document.getElementById('processoFormTitle').textContent = 'Editar: ' + proc.name;
        document.getElementById('processoFormId').value = id;
        document.getElementById('processoFormName').value = proc.name || '';
        document.getElementById('processoFormOwner').value = proc.owner || '';
        document.getElementById('processoFormArea').value = proc.area || '';
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

    document.getElementById('processoFormOverlay').classList.add('active');
}

// Salvar processo
document.getElementById('processoForm').addEventListener('submit', function(e) {
    e.preventDefault();
    var id = document.getElementById('processoFormId').value;
    var name = document.getElementById('processoFormName').value.trim();
    var owner = document.getElementById('processoFormOwner').value.trim();
    var area = document.getElementById('processoFormArea').value.trim();
    var color = document.getElementById('processoFormColor').value;
    var linksText = document.getElementById('processoFormLinks').value;
    var linksLines = linksText.split('\n').filter(function(l) { return l.trim() !== ''; });
    var links = linksLines.map(function(line) {
        var parts = line.split('|');
        return { label: (parts[0] || '').trim(), url: (parts[1] || '#').trim() };
    });

    var data = { name: name, owner: owner, area: area, color: color, links: links, order: 0 };

    if (id) {
        data.order = (processos[id] && processos[id].order) || 0;
        processosRef.child(id).set(data).then(function() {
            document.getElementById('processoFormOverlay').classList.remove('active');
        }).catch(function(err) {
            alert('Erro ao salvar: ' + err.message);
        });
    } else {
        var newId = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        if (!newId) newId = 'processo-' + Date.now().toString(36);
        if (processos[newId]) newId = newId + '-' + Date.now().toString(36);
        data.order = Object.keys(processos).length;
        processosRef.child(newId).set(data).then(function() {
            document.getElementById('processoFormOverlay').classList.remove('active');
        }).catch(function(err) {
            alert('Erro ao salvar: ' + err.message);
        });
    }
});

// Excluir processo
document.getElementById('btnDeleteProcesso').addEventListener('click', function() {
    if (!editingProcessoId) return;
    var name = processos[editingProcessoId] ? processos[editingProcessoId].name : '';
    if (confirm('Excluir processo "' + name + '"?')) {
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
