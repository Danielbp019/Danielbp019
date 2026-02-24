const fs = require("fs");
const https = require("https");

const username = process.env.GITHUB_USERNAME || "Danielbp019";
const token = process.env.GITHUB_TOKEN;

// Colores estilo Tokyonight + colores comunes de lenguajes
const theme = {
  background: "#1a1b27",
  text: "#c0caf5",
  barBg: "#24283b",
};

const languageColors = {
  // Frontend
  JavaScript: "#f7df1e",
  TypeScript: "#3178c6",
  HTML: "#e34c26",
  CSS: "#264de4",
  Vue: "#42b883",

  // Backend web
  PHP: "#777bb4",
  Python: "#3572A5",
  Ruby: "#cc342d",
  Go: "#00ADD8",
  Rust: "#dea584",

  // Infra común web
  SQL: "#e38c00",
  Shell: "#89e051",
  Dockerfile: "#384d54",
};

function fetchRepos() {
  return new Promise((resolve, reject) => {
    https.get(
      {
        hostname: "api.github.com",
        path: `/users/${username}/repos?per_page=100`,
        headers: {
          "User-Agent": "node",
          ...(token ? { Authorization: `token ${token}` } : {}),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(err);
          }
        });
        res.on("error", reject);
      },
    );
  });
}

(async () => {
  const repos = await fetchRepos();

  const totals = {};
  let totalCount = 0; // contador de todos los repos con lenguaje
  for (const repo of repos) {
    if (!repo.language) continue;
    totals[repo.language] = (totals[repo.language] || 0) + 1;
    totalCount++;
  }

  const sorted = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const max = sorted[0]?.[1] || 1; // para escalar barras al 100%

  let bars = "";
  sorted.forEach(([lang, count], i) => {
    const width = (count / max) * 400;
    const color = languageColors[lang] || "#7aa2f7";
    const percent = Math.round((count / totalCount) * 100); // porcentaje del total

    bars += `
      <text x="40" y="${80 + i * 50}" fill="${theme.text}" font-size="18">
        ${lang}: ${percent}%
      </text>
      <rect x="40" y="${90 + i * 50}" width="400" height="20" fill="${theme.barBg}" rx="5"/>
      <rect x="40" y="${90 + i * 50}" width="${width}" height="20" fill="${color}" rx="5"/>
    `;
  });

  const svg = `
<svg width="500" height="${sorted.length * 50 + 120}" xmlns="http://www.w3.org/2000/svg">
  <rect 
    width="100%" 
    height="100%" 
    fill="${theme.background}" 
    rx="15" 
    stroke="white"
    stroke-width="2"
  />
  <text x="40" y="50" fill="${theme.text}" font-size="24" font-weight="bold" font-family="Roboto, sans-serif">
    Lenguajes más usados
  </text>
  ${bars}
</svg>
`;

  fs.writeFileSync("langs.svg", svg);
})();
