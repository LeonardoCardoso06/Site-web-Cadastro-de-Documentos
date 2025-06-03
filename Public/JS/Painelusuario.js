const token = localStorage.getItem("token");
if (!token) {
  alert("Você precisa estar logado para acessar esta página.");
  window.location.href = "Pagina1_Login.html";
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "Pagina1_Login.html";
}

function formatarTipoDocumento(tipo) {
  const nomesFormatados = {
    rgCnh: "RG / CNH",
    comprovanteResidencia: "Comprovante de Residência",
    tituloEleitor: "Título de Eleitor",
    certidaoMilitar: "Certidão Militar",
    exameMedico: "Exame Médico",
    historicoEscolar: "Histórico Escolar",
    pis: "PIS",
    carteirinha: "Carteirinha",
    cpf: "CPF",
    rg: "RG",
    outro: "Outro",
  };
  return nomesFormatados[tipo] || tipo;
}

function carregarUsuario() {
  fetch("http://localhost:3000/api/auth/me", {
    headers: { Authorization: "Bearer " + token },
  })
    .then((res) => {
      if (!res.ok) throw new Error("Não autorizado");
      return res.json();
    })
    .then((user) => {
      document.getElementById("nomeUsuario").textContent =
        user.firstname + " " + user.lastname;
      document.getElementById("email").textContent = user.email || "-";
      document.getElementById("phone").textContent = user.phone || "-";
      document.getElementById("gender").textContent = user.gender || "-";
      document.getElementById("cpf").textContent = user.cpf || "-";
      document.getElementById("address").textContent = user.address || "-";
      document.getElementById("vt").textContent = user.vale_transporte
        ? "Sim"
        : "Não";
      document.getElementById("deficiencia").textContent =
        user.possui_deficiencia ? "Sim" : "Não";
      document.getElementById("obs").textContent = user.observacoes || "-";

      const lista = document.getElementById("listaDocs");
      lista.innerHTML = "";

      if (user.arquivos && user.arquivos.length > 0) {
        user.arquivos.forEach((doc) => {
          const url = `http://localhost:3000/${doc.path.replace(/\\/g, "/")}`;
          const item = document.createElement("li");

          item.innerHTML = `
                  <span>
                    <a href="${url}" target="_blank">${formatarTipoDocumento(
            doc.document_type
          )}</a>
                  </span>
                  <input type="file" id="upload-${
                    doc.document_type
                  }" style="display:none" accept=".pdf,.jpg,.jpeg,.png"
                    onchange="substituirDocumento('${
                      doc.document_type
                    }', this.files[0])" />
                  <button class="delete-btn" onclick="document.getElementById('upload-${
                    doc.document_type
                  }').click()">Substituir</button>
                `;
          lista.appendChild(item);
        });
      } else {
        lista.innerHTML = "<li>Nenhum documento enviado.</li>";
      }
    })
    .catch((err) => {
      alert("Erro ao carregar dados. Faça login novamente.");
      logout();
    });
}

function substituirDocumento(tipo, file) {
  if (!file) return;

  const userId = JSON.parse(atob(token.split(".")[1])).userId;
  const formData = new FormData();
  formData.append("userId", userId);
  formData.append(tipo, file);

  fetch("http://localhost:3000/api/auth/upload-multiple", {
    method: "POST",
    headers: { Authorization: "Bearer " + token },
    body: formData,
  })
    .then((res) => res.json())
    .then((result) => {
      if (result.message) {
        alert("Documento substituído com sucesso!");
        carregarUsuario();
      } else {
        alert("Erro ao substituir: " + (result.error || result.details));
      }
    })
    .catch((err) => {
      alert("Erro ao enviar: " + err.message);
    });
}

carregarUsuario();
