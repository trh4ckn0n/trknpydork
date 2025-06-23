// Sélecteurs pour génération de dorks via OpenAI
const generateBtn = document.getElementById('generateBtn');
const promptInput = document.getElementById('prompt');
const generatedDorksDiv = document.getElementById('generatedDorks');

// Sélecteurs pour scan des dorks
const startScanBtn = document.getElementById('startScanBtn');
const dorksInput = document.getElementById('dorksInput');
const resultsTable = document.getElementById('resultsTable');
const tbody = resultsTable.querySelector('tbody');

// Génération des dorks via WebSocket OpenAI
generateBtn.onclick = () => {
  const prompt = promptInput.value.trim();
  if (!prompt) {
    alert("Entre une demande pour générer les dorks");
    return;
  }

  generatedDorksDiv.style.display = 'block';
  generatedDorksDiv.textContent = "Génération en cours...";

  const ws = new WebSocket(`ws://${window.location.host}/ws/generate_dorks`);

  ws.onopen = () => {
    ws.send(prompt);
  };

  ws.onmessage = (event) => {
    try {
      const dorks = JSON.parse(event.data);
      if (Array.isArray(dorks) && dorks.length > 0) {
        generatedDorksDiv.textContent = dorks.join("\n");
        dorksInput.value = dorks.join("\n"); // Remplir textarea scan avec les dorks générés
      } else {
        generatedDorksDiv.textContent = "Aucun dork généré.";
      }
    } catch (e) {
      generatedDorksDiv.textContent = "Erreur dans la réponse du serveur.";
      console.error(e);
    }
    ws.close();
  };

  ws.onerror = (err) => {
    generatedDorksDiv.textContent = "Erreur lors de la génération.";
    console.error("WebSocket error:", err);
  };
};

// Scan des dorks via WebSocket
startScanBtn.onclick = () => {
  const dorksText = dorksInput.value.trim();
  if (!dorksText) {
    alert("Entre au moins un dork");
    return;
  }

  const dorks = dorksText.split("\n").map(line => line.trim()).filter(Boolean);
  tbody.innerHTML = '';
  resultsTable.style.display = "table";

  const ws = new WebSocket(`ws://${window.location.host}/ws/scan`);

  ws.onopen = () => {
    ws.send(JSON.stringify({ dorks }));
  };

  ws.onmessage = (event) => {
    try {
      const res = JSON.parse(event.data);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${res.dork}</td>
        <td><a href="${res.url}" target="_blank" rel="noopener noreferrer">${res.url}</a></td>
        <td>${res.status}</td>
        <td>${res.content_length}</td>
        <td>${res.risk}</td>
        <td>${res.country}</td>
      `;
      tbody.appendChild(tr);
    } catch (e) {
      console.error("Erreur en traitant le message:", e);
    }
  };

  ws.onerror = (err) => {
    alert("Erreur WebSocket lors du scan");
    console.error("WebSocket error:", err);
  };

  ws.onclose = () => {
    console.log("Scan terminé");
  };
};
