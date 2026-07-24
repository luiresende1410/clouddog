# CloudDog - Mapa Organizacional

Sistema interativo para visualizar e gerenciar o organograma da CloudDog, com edição em tempo real via Firebase.

## Funcionalidades

- Visualização do mapa organizacional com setas de ligação
- Clique em qualquer área para ver: Gestor, Líder, Membros e Links
- Clique no ícone de edição (ou botão direito) para editar uma área
- Botão "+ Nova Área" para adicionar novas áreas
- Escolha a "Área Pai" para definir a hierarquia (setas)
- Edição de cor, membros e links de processos
- Tudo salvo em tempo real no Firebase (atualizações em todos os dispositivos)

## Setup - Firebase

### 1. Criar projeto no Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Dê um nome (ex: `clouddog-orgmap`)
4. Desative o Google Analytics se não precisar
5. Clique em "Criar projeto"

### 2. Ativar Realtime Database

1. No painel do projeto, vá em **Build > Realtime Database**
2. Clique em **"Criar banco de dados"**
3. Escolha a região (us-central1 funciona bem)
4. Selecione **"Iniciar no modo de teste"** (permite leitura/escrita por 30 dias)
5. Clique em "Ativar"

### 3. Registrar o app web

1. Na página inicial do projeto, clique no ícone **</> (Web)**
2. Dê um apelido (ex: "orgmap-web")
3. **NÃO** marque Firebase Hosting por enquanto
4. Clique em "Registrar app"
5. Copie o objeto `firebaseConfig` que aparece

### 4. Configurar o projeto

Abra o arquivo `app.js` e substitua o bloco `firebaseConfig` com as credenciais copiadas:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSy...",
    authDomain: "clouddog-orgmap.firebaseapp.com",
    databaseURL: "https://clouddog-orgmap-default-rtdb.firebaseio.com",
    projectId: "clouddog-orgmap",
    storageBucket: "clouddog-orgmap.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};
```

### 5. Testar localmente

Basta abrir `index.html` no navegador. Na primeira vez, os dados iniciais do mapa serão populados automaticamente.

## Deploy no Firebase Hosting (opcional)

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## Deploy no GitHub Pages (alternativa)

1. Crie um repositório no GitHub
2. Faça push dos arquivos
3. Vá em Settings > Pages
4. Selecione a branch `main` e pasta `/` (root)
5. Acesse pelo link gerado

## Estrutura dos Arquivos

```
├── index.html          # Página principal
├── style.css           # Estilos
├── app.js              # Lógica + Firebase
├── firebase.json       # Config Firebase Hosting
├── database.rules.json # Regras do banco
└── README.md           # Este arquivo
```

## Como Usar

| Ação | Como fazer |
|------|-----------|
| Ver detalhes de uma área | Clique na caixa |
| Editar uma área | Clique no ícone ✎ (ou botão direito) |
| Criar nova área | Botão "+ Nova Área" |
| Definir hierarquia | Selecione a "Área Pai" no formulário |
| Adicionar membros | Um nome por linha no campo "Membros" |
| Adicionar links | Formato: `Nome do Link | https://url.com` |
| Excluir área | Botão "Excluir" no formulário de edição |
