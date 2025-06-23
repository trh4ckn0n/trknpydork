const scanSocket = new WebSocket(`ws://${window.location.host}/ws/scan`);
const generateSocket = new WebSocket(`ws://${window.location.host}/ws/generate_dorks`);

const dorkInput = document.getElementById('dork-input');
const generateBtn = document.getElementById('generate-btn');
const scanBtn = document.getElementById('scan-btn');
const resultsDiv = document.getElementById('results');

function appendResult(text) {
  const p = document.createElement('p');
  p.textContent = text;
  resultsDiv.appendChild(p);
}

scanBtn.onclick = () => {
  resultsDiv.innerHTML = '';
  let dorks = dorkInput.value.split('\n').filter(Boolean);
  if (dorks.length === 0) {
    appendResult('Merci d\'entrer au moins un dork');
    return;
  }
  scanSocket.onopen = () => {
    scanSocket.send(JSON.stringify({ dorks }));
  };
};

scanSocket.onmessage = (event) => {
  let data = JSON.parse(event.data);
  appendResult(`Dork: ${data.dork} | Status: ${data.status} | Length: ${data.content_length} | Risk: ${data.risk}`);
};

scanSocket.onclose = () => {
  appendResult('Scan terminé.');
};

generateBtn.onclick = () => {
  resultsDiv.innerHTML = '';
  let prompt = dorkInput.value.trim();
  if (!prompt) {
    appendResult('Merci d\'entrer un prompt pour générer des dorks');
    return;
  }
  generateSocket.onopen = () => {
    generateSocket.send(prompt);
  };
};

generateSocket.onmessage = (event) => {
  let dorks = JSON.parse(event.data);
  appendResult('Dorks générés :');
  dorks.forEach(d => appendResult(d));
};

generateSocket.onclose = () => {
  appendResult('Génération terminée.');
};
