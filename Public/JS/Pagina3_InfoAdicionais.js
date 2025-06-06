function formatarCPF(input) {
  let valor = input.value.replace(/\D/g, "");
  if (valor.length > 11) valor = valor.slice(0, 11);
  valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
  valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
  valor = valor.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  input.value = valor;
}

function formatarCEP(input) {
  let valor = input.value.replace(/\D/g, "").slice(0, 8);
  valor = valor.replace(/^(\d{5})(\d{1,3})/, "$1-$2");
  input.value = valor;
}

function formatarTelefone(input) {
  let valor = input.value.replace(/\D/g, "");
  if (valor.length > 11) valor = valor.slice(0, 11);
  if (valor.length > 10) {
    input.value = valor.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  } else if (valor.length > 6) {
    input.value = valor.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  } else if (valor.length > 2) {
    input.value = valor.replace(/(\d{2})(\d{0,5})/, "($1) $2");
  } else {
    input.value = valor;
  }
}

document
  .getElementById("registrationForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const userId = localStorage.getItem("userId");
    if (!userId) {
      alert("Usuário não identificado. Faça o cadastro novamente.");
      window.location.href = "Pagina2_Cadastro.html";
      return;
    }

    const formData = new FormData(this);
    const body = {
      userId,
      birthdate: formData.get("birthdate"),
      cpf: formData.get("cpf"),
      address: formData.get("address"),
      valeTransporte: formData.get("vt") === "sim",
      numeroOnibus: formData.get("busQuantity") || "",
      numeroTrem: formData.get("trainMetro") || "",
      possuiDeficiencia: formData.get("disability") === "sim",
      observacoes: formData.get("disabilityType") || "",
    };

    try {
      const response = await fetch("http://localhost:3000/api/auth/details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (response.ok) {
        alert("Informações adicionais salvas!");
        window.location.href = "Pagina4_Arquivos.html";
      } else {
        alert("Erro: " + (result.error || result.details));
      }
    } catch (err) {
      alert("Erro ao enviar: " + err.message);
    }
  });

// Mostrar/ocultar campos de VT
document.getElementById("vt").addEventListener("change", function () {
  document
    .getElementById("vtDetails")
    .classList.toggle("hidden", this.value !== "sim");
});

// Mostrar/ocultar campos de Deficiência
document.getElementById("disability").addEventListener("change", function () {
  document
    .getElementById("disabilityDetails")
    .classList.toggle("hidden", this.value !== "sim");
});

document
  .getElementById("cpf")
  .addEventListener("input", (e) => formatarCPF(e.target));
document
  .getElementById("cep")
  .addEventListener("input", (e) => formatarCEP(e.target));
document
  .getElementById("emergencyNumber")
  .addEventListener("input", (e) => formatarTelefone(e.target));
