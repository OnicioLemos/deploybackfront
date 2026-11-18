// Endereço da API.
// Rodando localmente (Live Server), usa a API local; publicado, usa a do Render.
// >>> Depois do deploy da API, troque a URL abaixo pela sua. <<<
const API_URL = ['localhost', '127.0.0.1'].includes(location.hostname)
  ? 'http://localhost:3000'
  : 'https://SUA-API.onrender.com';
