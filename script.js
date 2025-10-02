// script.js
function sendMessage() {
  const input = document.getElementById("chat-input");
  const message = input.value.trim();
  if (message) {
    appendMessage("You", message);
    input.value = "";
    // Simulate Copilot response
    setTimeout(() => appendMessage("Copilot", "Got it! How can I help next?"), 500);
  }
}

function appendMessage(sender, text) {
  const chatBox = document.getElementById("chat-box");
  const msg = document.createElement("div");
  msg.className = "chat-message";
  msg.innerHTML = `<strong>${sender}:</strong> ${text}`;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (file) {
    const imgURL = URL.createObjectURL(file);
    appendMessage("You", `<img src="${imgURL}" width="150" />`);
  }
}

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (file) {
    appendMessage("You", `📁 Uploaded file: ${file.name}`);
  }
}

function handleCameraUpload(event) {
  const file = event.target.files[0];
  if (file) {
    const imgURL = URL.createObjectURL(file);
    appendMessage("You", `<img src="${imgURL}" width="150" />`);
  }
}