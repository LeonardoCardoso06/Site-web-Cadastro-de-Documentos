document
  .getElementById("registrationForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = new FormData(this);

    try {
      const response = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        const email = formData.get("email");
        const password = formData.get("password");

        // Salva ID para os próximos passos
        localStorage.setItem("userId", result.userId);

        // 🟡 Faz login automático após o cadastro
        const loginResponse = await fetch(
          "http://localhost:3000/api/auth/login",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          }
        );

        const loginResult = await loginResponse.json();

        if (loginResponse.ok && loginResult.token) {
          localStorage.setItem("token", loginResult.token);
          localStorage.setItem("userName", loginResult.user.name);
          localStorage.setItem("userId", loginResult.user.id);
        }

        // Redireciona para informações adicionais
        window.location.href = "Pagina3_InfoAdicionais.html";
      } else {
        alert("Erro ao cadastrar: " + (result.error || result.details));
      }
    } catch (err) {
      alert("Erro no envio: " + err.message);
    }
  });
