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
      numeroOnibus: formData.get("busQuantity") || null,
      numeroTrem: formData.get("trainMetro") || null,
      possuiDeficiencia: formData.get("disability") === "sim",
      observacoes: formData.get("disabilityType") || null,
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
