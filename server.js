require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch'); // npm install node-fetch@2
const app = express();

const GIT_TOKEN = process.env.GIT_TOKEN;      // Твій GitHub PAT
const GIT_REPO = process.env.GIT_REPO;        // username/repo
const GIT_BRANCH = process.env.GIT_BRANCH || 'main';

app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Функція оновлення файлу на GitHub
async function updateFileOnGitHub(filename, content) {
  try {
    const apiUrl = `https://api.github.com/repos/${GIT_REPO}/contents/public/${filename}`;
    
    // Отримати SHA файлу (якщо існує)
    const getResp = await fetch(apiUrl, {
      headers: { Authorization: `token ${GIT_TOKEN}`, Accept: 'application/vnd.github+json' }
    });
    const getData = await getResp.json();
    const sha = getData.sha;

    const body = {
      message: "Автоматичне оновлення полігонів",
      content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
      branch: GIT_BRANCH,
      sha: sha ? sha : undefined
    };

    const putResp = await fetch(apiUrl, {
      method: 'PUT',
      headers: { Authorization: `token ${GIT_TOKEN}`, Accept: 'application/vnd.github+json' },
      body: JSON.stringify(body)
    });

    const putData = await putResp.json();
    console.log('GitHub update response:', putData);
  } catch (err) {
    console.error('Помилка при оновленні GitHub:', err);
  }
}

// POST ендпоінт для збереження полігонів
app.post('/polygons', async (req, res) => {
  const polygons = req.body;
  await updateFileOnGitHub('polygons.json', polygons);
  res.send('Полігони збережено у GitHub ✅');
});

// GET головної сторінки
app.get('/', (req, res) => res.sendFile(__dirname + '/public/index.html'));

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
