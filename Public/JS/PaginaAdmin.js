// --- Funções de formatação ---
function formatarNumeroComEspacos(numero) {
  if (!numero) return "-";
  return numero
    .toString()
    .replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1 $2 $3 $4");
}

function formatarSimples(numero) {
  if (!numero) return "-";
  return numero.toString().replace(/(\d{3})(\d+)/, "$1-$2");
}

function formatarTelefone(numero) {
  if (!numero) return "-";
  return numero.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
}

function formatarCPF(cpf) {
  if (!cpf) return "-";
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function traduzirGenero(valor) {
  const map = { male: "Masculino", female: "Feminino", other: "Outro" };
  return map[valor] || valor;
}

function formatarData(dataIso) {
  if (!dataIso) return "-";
  const data = new Date(dataIso);
  return data.toLocaleDateString("pt-BR");
}

function formatarTipoDocumento(tipo) {
  const nomesFormatados = {
    rgCnhFrente: "CPF/CNH - Frente",
    rgCnhVerso: "CPF/CNH - Verso",
    comprovanteResidencia: "Comprovante de Residência",
    tituloEleitor: "Título de Eleitor",
    certidaoMilitar: "Certidão Militar",
    exameMedico: "Exame Médico",
    historicoEscolar: "Histórico Escolar",
    pis: "PIS",
    carteirinha: "Carteirinha",
  };
  return nomesFormatados[tipo] || tipo;
}

// --- Variáveis globais ---
const token = localStorage.getItem("token");
let modoGerenciar = false;

// --- Controle modo gerenciar ---
function toggleModoGerenciar() {
  modoGerenciar = !modoGerenciar;
  document.querySelectorAll("th.delete-column").forEach((el) => {
    el.style.display = modoGerenciar ? "table-cell" : "none";
  });
  carregarUsuarios();
}

// --- Modal foto com zoom ---
function abrirVisualizacaoFoto(url) {
  const modal = document.getElementById("fotoModal");
  const imagem = document.getElementById("fotoModalImagem");
  imagem.src = url;
  modal.style.display = "flex";
}

// --- Modal genérico fechar ---
function fecharModal(id) {
  document.getElementById(id).style.display = "none";
}

// --- Visualizar documentos (pdf, imagens) ---
function visualizarDocumento(url, titulo) {
  const conteudo = document.getElementById("visualizarConteudo");
  const ext = url.split(".").pop().toLowerCase();
  let elemento;

  if (["jpg", "jpeg", "png", "gif"].includes(ext)) {
    elemento = `<img src="${url}" style="max-width:90%; max-height:80vh; border-radius:10px;" />`;
  } else if (ext === "pdf") {
    elemento = `<embed src="${url}" type="application/pdf" width="100%" height="600px" />`;
  } else {
    elemento = `<p>Visualização não suportada para este tipo de arquivo.</p>`;
  }

  document.getElementById("visualizarTitulo").textContent = titulo;
  conteudo.innerHTML = elemento;
  document.getElementById("visualizarModal").style.display = "block";
}

// --- Baixar documento com fetch + token ---
function baixarDocumento(url, nomeDesejado) {
  fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => {
      if (!res.ok) throw new Error("Erro ao baixar documento");
      return res.blob();
    })
    .then((blob) => {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = nomeDesejado;
      document.body.appendChild(link);
      link.click();
      link.remove();
    })
    .catch((err) => {
      alert("Erro ao baixar documento.");
      console.error(err);
    });
}

// --- Renderiza cada linha da tabela de usuários ---
function renderUsuarioRow(user) {
  const fotoUrl = user.picture_path
    ? `http://localhost:3000/${user.picture_path.replace(/\\/g, "/")}`
    : null;

  const fotoHTML = fotoUrl
    ? `<img src="${fotoUrl}" class="foto-admin" alt="Foto" onclick="abrirVisualizacaoFoto('${fotoUrl}')" />`
    : `<div class="foto-placeholder" title="Sem foto">👤</div>`;

  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${fotoHTML}</td>
    <td>${user.firstname} ${user.lastname}</td>
    <td>${user.cpf || "-"}</td>
    <td>
      <div class="action-buttons">
        <button class="painel-button" onclick='abrirModalInfo(${JSON.stringify(
          user
        )})'>👤 Informações</button>
        <button class="painel-button" onclick='abrirModalDocumentos(${JSON.stringify(
          user
        )})'>📁 Documentos</button>
      </div>
    </td>
    <td class="delete-column">
      <button class="delete-btn" onclick="excluirUsuario(${
        user.id
      })">🗑️</button>
    </td>
  `;
  tr.querySelector(".delete-column").style.display = modoGerenciar
    ? "table-cell"
    : "none";
  document.getElementById("usuariosBody").appendChild(tr);
}

// --- Carregar usuários da API ---
async function carregarUsuarios() {
  try {
    const response = await fetch("http://localhost:3000/api/auth/usuarios", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const usuarios = await response.json();
    const tbody = document.getElementById("usuariosBody");
    tbody.innerHTML = "";
    usuarios.forEach(renderUsuarioRow);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
  }
}

// --- Excluir usuário ---
async function excluirUsuario(userId) {
  if (!confirm("Tem certeza que deseja excluir este usuário?")) return;
  try {
    const response = await fetch(
      `http://localhost:3000/api/auth/usuarios/${userId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (response.ok) {
      alert("Usuário excluído com sucesso.");
      carregarUsuarios();
    } else {
      alert("Erro ao excluir usuário.");
    }
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
  }
}

// --- Abrir modal com informações detalhadas do usuário ---
async function abrirModalInfo(user) {
  try {
    const response = await fetch(
      `http://localhost:3000/api/auth/usuarios/${user.id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const dados = await response.json();
    document.getElementById(
      "infoNome"
    ).textContent = `${dados.firstname} ${dados.lastname}`;

    const infoContainer = document.getElementById("infoContainer");
    infoContainer.innerHTML = `
      <div class="info-col"><strong>Email:</strong> ${dados.email || "-"}</div>
      <div class="info-col"><strong>Telefone:</strong> ${formatarTelefone(
        dados.phone
      )}</div>
      <div class="info-col"><strong>Gênero:</strong> ${traduzirGenero(
        dados.gender
      )}</div>
      <div class="info-col"><strong>CPF:</strong> ${formatarCPF(
        dados.cpf
      )}</div>
      <div class="info-col"><strong>Endereço:</strong> ${
        dados.address || "-"
      }</div>
      <div class="info-col"><strong>Data de Nascimento:</strong> ${formatarData(
        dados.birthdate
      )}</div>
      <div class="info-col"><strong>VT:</strong> ${
        dados.vale_transporte ? "Sim" : "Não"
      }</div>
      <div class="info-col"><strong>Nº Trem:</strong> ${formatarSimples(
        dados.numero_trem
      )}</div>
      <div class="info-col"><strong>Nº Ônibus:</strong> ${formatarSimples(
        dados.numero_onibus
      )}</div>
      <div class="info-col"><strong>Deficiência:</strong> ${
        dados.possui_deficiencia ? "Sim" : "Não"
      }</div>
      <div class="info-col" style="grid-column: span 2;"><strong>Observações:</strong> ${
        dados.observacoes || "-"
      }</div>
    `;
    document.getElementById("infoModal").style.display = "block";
  } catch (error) {
    alert("Erro ao carregar informações do usuário.");
    console.error(error);
  }
}

// --- Abrir modal com documentos do usuário ---
async function abrirModalDocumentos(user) {
  try {
    const response = await fetch(
      `http://localhost:3000/api/auth/usuarios/${user.id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const dados = await response.json();
    document.getElementById(
      "modalNome"
    ).textContent = `${dados.firstname} ${dados.lastname}`;

    const container = document.getElementById("documentosContainer");
    container.innerHTML = "";

    if (!dados.arquivos || dados.arquivos.length === 0) {
      container.innerHTML = "<p>Nenhum documento encontrado.</p>";
    } else {
      dados.arquivos.forEach((doc) => {
        const div = document.createElement("div");
        div.className = "documento-item";
        const url = `http://localhost:3000/${doc.path.replace(/\\/g, "/")}`;
        const fileOnly = doc.path.split("/").pop();
        const downloadUrl = `http://localhost:3000/api/auth/download/${encodeURIComponent(
          fileOnly
        )}`;
        const nomeAmigavel = `${doc.document_type.replace(
          /[^a-z0-9]/gi,
          "_"
        )}${doc.filename.slice(doc.filename.lastIndexOf("."))}`;

        div.innerHTML = `
          <p><strong>${formatarTipoDocumento(doc.document_type)}</strong></p>
          <button class="painel-button" onclick="visualizarDocumento('${url}', '${
          doc.document_type
        }')">👁️ Visualizar</button>
          <button class="painel-button" onclick="baixarDocumento('${downloadUrl}', '${nomeAmigavel}')">⬇️ Download</button>
        `;

        container.appendChild(div);
      });
    }

    document.getElementById("documentosModal").style.display = "block";
  } catch (error) {
    alert("Erro ao carregar documentos do usuário.");
    console.error(error);
  }
}

// --- Filtrar usuários na tabela pelo nome ---
function filtrarUsuarios() {
  const termo = document.getElementById("search").value.toLowerCase();
  const linhas = document.querySelectorAll("#usuariosBody tr");
  linhas.forEach((linha) => {
    const nome = linha.cells[1].textContent.toLowerCase();
    linha.style.display = nome.includes(termo) ? "" : "none";
  });
}

// --- Inicializa a listagem ---
carregarUsuarios();
