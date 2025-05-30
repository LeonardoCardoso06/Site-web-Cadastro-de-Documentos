let cropper;
let imagemOriginal;

function abrirModalImagem() {
  document.getElementById("picture__input").click();
}

function carregarImagem(event) {
  const file = event.target.files[0];
  if (!file) return;

  // ✅ Mostrar preview direto no avatar
  const preview = document.getElementById("picturePreview");
  const url = URL.createObjectURL(file);
  preview.src = url;

  imagemOriginal = url;
  document.getElementById("imagemCrop").src = imagemOriginal;
  document.getElementById("modalCropper").style.display = "block";

  setTimeout(() => {
    cropper = new Cropper(document.getElementById("imagemCrop"), {
      aspectRatio: 1,
      viewMode: 1,
      autoCropArea: 1,
    });
  }, 100);
}

function fecharModalImagem() {
  document.getElementById("modalCropper").style.display = "none";
  if (cropper) cropper.destroy();
  cropper = null;
}

function confirmarCorte() {
  if (!cropper) return;
  cropper.getCroppedCanvas().toBlob((blob) => {
    const file = new File([blob], "foto_perfil.jpg", { type: "image/jpeg" });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    const input = document.getElementById("picture__input");
    input.files = dataTransfer.files;

    const preview = document.getElementById("picturePreview");
    preview.src = URL.createObjectURL(file);

    fecharModalImagem();
  }, "image/jpeg");
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

function formatarCPF(input) {
  let valor = input.value.replace(/\D/g, "");
  if (valor.length > 11) valor = valor.slice(0, 11);
  valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
  valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
  valor = valor.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  input.value = valor;
}

function previewImage(event) {
  const reader = new FileReader();
  reader.onload = function () {
    document.getElementById("picturePreview").src = reader.result;
  };
  reader.readAsDataURL(event.target.files[0]);
}

document
  .getElementById("registrationForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const form = document.getElementById("registrationForm");
    const formData = new FormData(form);

    const imagemInput = document.getElementById("picture__input");
    if (imagemInput.files.length > 0) {
      formData.set("picture__input", imagemInput.files[0]);
    }

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
