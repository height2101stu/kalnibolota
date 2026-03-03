require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const app = express();

const GIT_TOKEN = process.env.GIT_TOKEN;
const GIT_REPO = process.env.GIT_REPO;
const GIT_BRANCH = process.env.GIT_BRANCH || 'main';

app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

const headers = {
  Authorization: `token ${GIT_TOKEN}`,
  Accept: 'application/vnd.github+json'
};

/* =========================
   ОНОВЛЕННЯ ФАЙЛУ В GITHUB
========================= */
async function updateFileOnGitHub(filename, content) {

  const apiUrl = `https://api.github.com/repos/${GIT_REPO}/contents/public/${filename}`;

  let sha;

  const getResp = await fetch(`${apiUrl}?ref=${GIT_BRANCH}`, { headers });

  if (getResp.status === 200) {
    const getData = await getResp.json();
    sha = getData.sha;
  }

  const body = {
    message: "Автоматичне оновлення полігонів",
    content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
    branch: GIT_BRANCH
  };

  if (sha) body.sha = sha;

  const putResp = await fetch(apiUrl, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body)
  });

  if (!putResp.ok) {
    const err = await putResp.text();
    throw new Error(err);
  }

  return await putResp.json();
}

/* =========================
   GET polygons.json
========================= */
app.get('/polygons.json', async (req, res) => {

  try {
    const apiUrl = `https://api.github.com/repos/${GIT_REPO}/contents/public/polygons.json?ref=${GIT_BRANCH}`;
    const response = await fetch(apiUrl, { headers });

    if (!response.ok) {
      return res.json({ type: "FeatureCollection", features: [] });
    }

    const data = await response.json();

    const content = JSON.parse(
      Buffer.from(data.content, 'base64').toString()
    );

    res.json(content);

  } catch (err) {
    console.error(err);
    res.json({ type: "FeatureCollection", features: [] });
  }
});

/* =========================
   POST polygons
========================= */
app.post('/polygons', async (req, res) => {

  try {
    await updateFileOnGitHub('polygons.json', req.body);
    res.json({ status: "ok" });

  } catch (err) {
    console.error("GitHub error:", err);
    res.status(500).json({ error: "Помилка збереження" });
  }
});

app.get('/', (req, res) =>
  res.sendFile(__dirname + '/public/index.html')
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);