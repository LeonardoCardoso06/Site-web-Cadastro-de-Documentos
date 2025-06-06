const token = localStorage.getItem("token");

document
  .getElementById("documentForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!token) {
      alert("Você precisa estar logado.");
      return (window.location.href = "Pagina1_Login.html");
    }

    const payload = JSON.parse(atob(token.split(".")[1]));
    const userId = payload.userId;

    const formData = new FormData();
    formData.append("userId", userId);

    const campos = [
      "rgCnhFrente",
      "rgCnhVerso",
      "comprovanteResidencia",
      "tituloEleitor",
      "certidaoMilitar",
      "exameMedico",
      "historicoEscolar",
      "pis",
      "carteirinha",
    ];

    campos.forEach((campo) => {
      const input = document.getElementById(campo);
      if (input && input.files.length > 0) {
        formData.append(campo, input.files[0]);
      }
    });

    try {
      const response = await fetch(
        "http://localhost:3000/api/auth/upload-multiple",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`, // ✅ Adicionado corretamente
          },
          body: formData,
        }
      );

      let result;
      try {
        result = await response.json();
      } catch (e) {
        const text = await response.text();
        alert("Erro ao enviar arquivos: " + text);
        return;
      }

      if (response.ok) {
        alert("Documentos enviados com sucesso!");
        window.location.href = "Painelusuario.html";
      } else {
        alert("Erro: " + (result.error || result.details));
      }
    } catch (err) {
      alert("Erro ao enviar arquivos: " + err.message);
      console.error(err);
    }
  });

// Atualiza nome dos arquivos ao selecionar
function atualizarNomeArquivo(inputId, labelId) {
  const input = document.getElementById(inputId);
  const label = document.getElementById(labelId);

  input.addEventListener("change", function () {
    label.textContent =
      input.files.length > 0
        ? input.files[0].name
        : "Nenhum arquivo selecionado";
  });
}

atualizarNomeArquivo("rgCnhFrente", "rgCnhFrenteName");
atualizarNomeArquivo("rgCnhVerso", "rgCnhVersoName");
atualizarNomeArquivo("comprovanteResidencia", "comprovanteResidenciaName");
atualizarNomeArquivo("tituloEleitor", "tituloEleitorName");
atualizarNomeArquivo("certidaoMilitar", "certidaoMilitarName");
atualizarNomeArquivo("exameMedico", "exameMedicoName");
atualizarNomeArquivo("historicoEscolar", "historicoEscolarName");
atualizarNomeArquivo("pis", "pisName");
atualizarNomeArquivo("carteirinha", "carteirinhaName");

// Carrega documentos já existentes
async function carregarDocumentosExistentes() {
  const userId = localStorage.getItem("userId");

  try {
    const response = await fetch("http://localhost:3000/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const dados = await response.json();

    if (dados.arquivos && dados.arquivos.length > 0) {
      const tipos = dados.arquivos.map((a) => a.document_type).join(", ");
      document.getElementById(
        "documentos-existentes"
      ).innerText = `Documentos já enviados: ${tipos}`;
    }
  } catch (err) {
    console.error("Erro ao carregar documentos existentes:", err);
  }
}

carregarDocumentosExistentes();
