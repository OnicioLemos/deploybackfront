// =====================================================
//  Front-end da Loja MVC — consome a API REST
// =====================================================

const $ = (seletor) => document.querySelector(seletor);

let produtos = [];          // cópia local da lista, usada pela busca
let timerCarregando = null;

// ---------- Sessão (token salvo no navegador) ----------
const sessao = {
  get token() { return localStorage.getItem('token'); },
  get usuario() { return JSON.parse(localStorage.getItem('usuario') || 'null'); },
  salvar(token, usuario) {
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
  },
  limpar() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  },
};

// ---------- Comunicação com a API ----------
async function api(caminho, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (sessao.token) headers.Authorization = `Bearer ${sessao.token}`;

  // Só mostra o aviso de "acordando o servidor" se demorar mais de 1,5 s
  clearTimeout(timerCarregando);
  timerCarregando = setTimeout(() => $('#carregando').classList.remove('oculto'), 1500);

  try {
    const resposta = await fetch(API_URL + caminho, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (resposta.status === 204) return null;
    const dados = await resposta.json().catch(() => ({}));

    // Token inválido ou expirado em rota protegida: volta para o login
    if (resposta.status === 401 && sessao.token && !caminho.startsWith('/auth/login')) {
      sair('Sua sessão expirou. Entre novamente.');
      throw new Error('Sessão expirada');
    }

    if (!resposta.ok) {
      const mensagem = dados.erros ? dados.erros.join(', ') : dados.erro || 'Erro inesperado';
      throw new Error(mensagem);
    }
    return dados;
  } catch (erro) {
    if (erro instanceof TypeError) {
      throw new Error('Não foi possível conectar à API. Verifique a URL em config.js.');
    }
    throw erro;
  } finally {
    clearTimeout(timerCarregando);
    $('#carregando').classList.add('oculto');
  }
}

// ---------- Utilidades de interface ----------
function avisar(texto, tipo = 'sucesso') {
  const toast = $('#toast');
  toast.textContent = texto;
  toast.className = `toast visivel ${tipo}`;
  setTimeout(() => toast.classList.remove('visivel'), 2500);
}

function formatarPreco(valor) {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function ocupado(botao, sim) {
  botao.disabled = sim;
}

// ---------- Troca de telas ----------
function mostrarApp() {
  $('#tela-acesso').classList.add('oculto');
  $('#tela-app').classList.remove('oculto');
  $('#nome-usuario').textContent = `Olá, ${sessao.usuario.nome}`;
  carregarProdutos();
}

function mostrarAcesso() {
  $('#tela-app').classList.add('oculto');
  $('#tela-acesso').classList.remove('oculto');
}

function sair(mensagem = '') {
  sessao.limpar();
  produtos = [];
  cancelarEdicao();
  mostrarAcesso();
  $('#msg-acesso').textContent = mensagem;
}

// ---------- Login e cadastro ----------
document.querySelectorAll('.aba').forEach((aba) => {
  aba.addEventListener('click', () => {
    document.querySelectorAll('.aba').forEach((a) => a.classList.toggle('ativa', a === aba));
    $('#form-login').classList.toggle('oculto', aba.dataset.aba !== 'login');
    $('#form-cadastro').classList.toggle('oculto', aba.dataset.aba !== 'cadastro');
    $('#msg-acesso').textContent = '';
  });
});

async function entrar(evento, rota) {
  evento.preventDefault();
  const form = evento.target;
  const botao = form.querySelector('button');
  $('#msg-acesso').textContent = '';
  ocupado(botao, true);
  try {
    const dados = Object.fromEntries(new FormData(form));
    const { token, usuario } = await api(rota, { method: 'POST', body: dados });
    sessao.salvar(token, usuario);
    form.reset();
    mostrarApp();
  } catch (erro) {
    $('#msg-acesso').textContent = erro.message;
  } finally {
    ocupado(botao, false);
  }
}

$('#form-login').addEventListener('submit', (e) => entrar(e, '/auth/login'));
$('#form-cadastro').addEventListener('submit', (e) => entrar(e, '/auth/cadastro'));
$('#btn-sair').addEventListener('click', () => sair());

// ---------- Produtos: listagem ----------
async function carregarProdutos() {
  try {
    produtos = await api('/produtos');
    renderizar();
  } catch (erro) {
    avisar(erro.message, 'erro');
  }
}

function renderizar() {
  const termo = $('#busca').value.trim().toLowerCase();
  const filtrados = produtos.filter((p) => p.nome.toLowerCase().includes(termo));
  const tbody = $('#lista-produtos');
  tbody.innerHTML = '';

  filtrados.forEach((p) => {
    const tr = document.createElement('tr');

    const tdNome = document.createElement('td');
    tdNome.textContent = p.nome; // textContent evita injeção de HTML

    const tdPreco = document.createElement('td');
    tdPreco.className = 'num';
    tdPreco.textContent = formatarPreco(p.preco);

    const tdEstoque = document.createElement('td');
    tdEstoque.className = 'num' + (p.estoque < 5 ? ' estoque-baixo' : '');
    tdEstoque.textContent = p.estoque;
    if (p.estoque < 5) tdEstoque.title = 'Estoque baixo';

    const tdAcoes = document.createElement('td');
    tdAcoes.className = 'acoes';
    const btnEditar = document.createElement('button');
    btnEditar.className = 'btn-tabela';
    btnEditar.textContent = 'Editar';
    btnEditar.addEventListener('click', () => iniciarEdicao(p));
    const btnExcluir = document.createElement('button');
    btnExcluir.className = 'btn-tabela excluir';
    btnExcluir.textContent = 'Excluir';
    btnExcluir.addEventListener('click', () => excluir(p));
    tdAcoes.append(btnEditar, btnExcluir);

    tr.append(tdNome, tdPreco, tdEstoque, tdAcoes);
    tbody.append(tr);
  });

  $('#contador').textContent = produtos.length;
  const vazio = $('#lista-vazia');
  vazio.textContent = produtos.length === 0
    ? 'Nenhum produto cadastrado ainda. Use o formulário acima.'
    : 'Nenhum produto encontrado para essa busca.';
  vazio.classList.toggle('oculto', filtrados.length > 0);
}

$('#busca').addEventListener('input', renderizar);

// ---------- Produtos: cadastrar e atualizar (mesmo formulário) ----------
$('#form-produto').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const form = evento.target;
  const botao = $('#btn-salvar');
  const { produtoId: id, nome, preco, estoque } = Object.fromEntries(new FormData(form));
  const corpo = { nome, preco: Number(preco), estoque: Number(estoque) };
  $('#msg-produto').textContent = '';
  ocupado(botao, true);

  try {
    if (id) {
      await api(`/produtos/${id}`, { method: 'PUT', body: corpo });
      avisar('Produto atualizado');
    } else {
      await api('/produtos', { method: 'POST', body: corpo });
      avisar('Produto cadastrado');
    }
    cancelarEdicao();
    await carregarProdutos();
  } catch (erro) {
    $('#msg-produto').textContent = erro.message;
  } finally {
    ocupado(botao, false);
  }
});

function iniciarEdicao(produto) {
  const form = $('#form-produto');
  const campos = form.elements;
  campos.produtoId.value = produto.id;
  campos.nome.value = produto.nome;
  campos.preco.value = Number(produto.preco);
  campos.estoque.value = produto.estoque;

  $('#titulo-form').textContent = `Editando: ${produto.nome}`;
  $('#btn-salvar').textContent = 'Salvar alterações';
  $('#btn-cancelar').classList.remove('oculto');
  form.closest('.cartao').classList.add('editando');
  campos.nome.focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelarEdicao() {
  const form = $('#form-produto');
  form.reset();
  form.elements.produtoId.value = '';
  $('#titulo-form').textContent = 'Novo produto';
  $('#btn-salvar').textContent = 'Cadastrar';
  $('#btn-cancelar').classList.add('oculto');
  $('#msg-produto').textContent = '';
  form.closest('.cartao').classList.remove('editando');
}

$('#btn-cancelar').addEventListener('click', cancelarEdicao);

// ---------- Produtos: excluir ----------
async function excluir(produto) {
  if (!confirm(`Excluir "${produto.nome}"? Essa ação não pode ser desfeita.`)) return;
  try {
    await api(`/produtos/${produto.id}`, { method: 'DELETE' });
    if ($('#form-produto').elements.produtoId.value == produto.id) cancelarEdicao();
    avisar('Produto excluído');
    await carregarProdutos();
  } catch (erro) {
    avisar(erro.message, 'erro');
  }
}

// ---------- Início: se já tem token salvo, entra direto ----------
if (sessao.token && sessao.usuario) {
  mostrarApp();
} else {
  mostrarAcesso();
}
