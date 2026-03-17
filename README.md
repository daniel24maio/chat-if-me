# UniAssist Frontend
A interface web responsiva para interação com o sistema de Regras e Compliance (RAG). Desenvolvido com **Next.js**, **TypeScript** e **Tailwind CSS**.

## 🚀 Funcionalidades
- **Chat Interativo:** Interface de chat com suporte a streaming de respostas do LLM local.
- **Dashboard de Status:** Exibição de status da conexão com o Modelo (Ollama) e latência.
- **Multi-tenancy:** Controle de visualização de regras baseadas no *Tenant ID* (Universidade/Departamento).
- **Privacidade:** Nenhuma conversa é enviada para APIs externas; tudo processado localmente ou via backend seguro.

## 🛠️ Stack Tecnológica
- **Framework:** Next.js 14+ (App Router)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS + Shadcn/ui
- **State:** Zustand / TanStack Query (React Query)
- **Validação:** Zod / React Hook Form

## 📦 Instalação

### Pré-requisitos
- Node.js 18+
- Docker (para rodar o backend em modo de desenvolvimento)

### Clonagem e Setup
```bash
git clone <URL_DO_REPOSITORIO>
cd front
npm install

---

### 2. README do Backend (`/back/README.md`)

```markdown
# UniAssist Backend API
API RESTful em **NestJS** que orquestra a chamada para modelos LLM locais (Ollama) e gerencia lógica de negócio, autenticação e RAG.

## 🧠 Arquitetura
O sistema é projetado para rodar com **LLMs Locais** (Ollama/vLLM), garantindo privacidade total e redução de custos de tokens.
- **Orquestrador:** NestJS (TypeScript)
- **Model Server:** Ollama (ex: Llama 3.2 8B)
- **Vector Store:** PostgreSQL (pgvector) ou Qdrant
- **Auth:** JWT + Multi-tenancy (Middleware)

## ✨ Funcionalidades Principais
1. **Geração de Respostas:** Stream de tokens diretamente do Ollama.
2. **RAG (Retrieval Augmented Generation):** Busca semântica no Banco de Dados para enriquecer o prompt.
3. **Caching de Prompts:** Redução de latência reutilizando contextos repetidos.
4. **Logs Centralizados:** Envio de analytics de uso para banco centralizado, mantendo dados de conversa no tenant local.

## ⚙️ Configuração
### Instalação
```bash
cd back
npm install
npm run start:dev


---

### 3. README do Banco de Dados (`/db/README.md`)

```markdown
# UniAssist Database Layer
Configuração e estrutura de dados para o sistema de Regras e Compliance. Utiliza **PostgreSQL** com extensão **pgvector** para RAG e **TypeORM** como ORM.

## 🗄️ Tecnologias
- **Motor:** PostgreSQL 16+
- **Extensão:** `pgvector` (para embedding de perguntas e respostas)
- **ORM:** TypeORM (TypeScript)
- **Seed:** Scripts SQL para inicialização de dados (Tenant, Usuários, Conhecimento)

## 📐 Esquema de Dados
O banco de dados é projetado para suportar múltiplos *tenants* (universidades/campos) em uma única instância para custo otimizado.

### Tabelas Principais
- **Users**: Autenticação e perfil (JWT).
- **Tenants**: Configuração por campo/universidade.
- **Chats**: Histórico de sessões (Logs).
- **KnowledgeBase**: VETORES (Embeddings) das perguntas e respostas do suporte.
- **Logs**: Acesso e erros para auditoria.

## 📦 Seed Scripts
Para popular o banco de dados, execute o script de seed:

```bash
cd db
npm run seed
